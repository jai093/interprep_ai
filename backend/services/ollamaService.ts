import { OLLAMA_CONFIG } from '../config/constants';

// --- Round-Robin Key Management ---

interface KeyState {
    key: string;
    requestCount: number;
    lastUsed: number;
    lastReset: number;
    isExhausted: boolean;
    exhaustedUntil: number;
}

class OllamaKeyManager {
    private keys: KeyState[];
    private currentIndex: number = 0;

    constructor(apiKeys: string[]) {
        this.keys = apiKeys.map(key => ({
            key,
            requestCount: 0,
            lastUsed: 0,
            lastReset: Date.now(),
            isExhausted: false,
            exhaustedUntil: 0,
        }));
    }

    /**
     * Get the next available API key using round-robin rotation.
     * Skips exhausted keys and marks keys as exhausted on 429 errors.
     */
    getNextKey(): string {
        if (this.keys.length === 0) {
            throw new Error('No Ollama API keys configured. Add OLLAMA_API_KEY_1 to .env.local');
        }

        const now = Date.now();

        // Try to find an available key starting from currentIndex
        for (let i = 0; i < this.keys.length; i++) {
            const idx = (this.currentIndex + i) % this.keys.length;
            const keyState = this.keys[idx];

            // Check if exhausted key has recovered
            if (keyState.isExhausted && now >= keyState.exhaustedUntil) {
                keyState.isExhausted = false;
                keyState.requestCount = 0;
                keyState.lastReset = now;
                console.log(`🔑 Key ${idx + 1} recovered from cooldown`);
            }

            if (!keyState.isExhausted) {
                this.currentIndex = (idx + 1) % this.keys.length;
                keyState.requestCount++;
                keyState.lastUsed = now;
                console.log(`🔑 Using key ${idx + 1}/${this.keys.length} (request #${keyState.requestCount})`);
                return keyState.key;
            }
        }

        // All keys exhausted — find the one that recovers soonest
        const soonest = this.keys.reduce((min, k) =>
            k.exhaustedUntil < min.exhaustedUntil ? k : min
        );
        const waitMs = soonest.exhaustedUntil - now;
        throw new Error(
            `All ${this.keys.length} API keys are exhausted. ` +
            `Earliest recovery in ${Math.ceil(waitMs / 60000)} minutes. ` +
            `Add more keys to .env.local to handle higher load.`
        );
    }

    /**
     * Mark the current key as exhausted (e.g., after a 429 response).
     * The key will be skipped for the cooldown duration.
     */
    markExhausted(key: string, cooldownMs: number = 4 * 60 * 60 * 1000): void {
        const keyState = this.keys.find(k => k.key === key);
        if (keyState) {
            keyState.isExhausted = true;
            keyState.exhaustedUntil = Date.now() + cooldownMs;
            const idx = this.keys.indexOf(keyState);
            console.warn(
                `⚠ Key ${idx + 1} exhausted. Cooldown: ${Math.ceil(cooldownMs / 60000)} min. ` +
                `${this.keys.filter(k => !k.isExhausted).length}/${this.keys.length} keys remaining.`
            );
        }
    }

    getStatus(): { total: number; available: number; exhausted: number } {
        const exhausted = this.keys.filter(k => k.isExhausted).length;
        return {
            total: this.keys.length,
            available: this.keys.length - exhausted,
            exhausted,
        };
    }
}

// Singleton key manager
const keyManager = new OllamaKeyManager(OLLAMA_CONFIG.keys);

// --- Ollama Chat API ---

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface OllamaOptions {
    json?: boolean;       // Request JSON-formatted response
    temperature?: number; // 0-1, default 0.7
    maxRetries?: number;  // Default 2
}

/**
 * Send a chat completion request to Ollama Cloud.
 * Uses round-robin key management and automatic retry on 429.
 */
export async function ollamaChat(
    messages: ChatMessage[],
    options: OllamaOptions = {}
): Promise<string> {
    const { json = false, temperature = 0.7, maxRetries = 2 } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const apiKey = keyManager.getNextKey();

        try {
            const requestBody: any = {
                model: OLLAMA_CONFIG.model,
                messages,
                stream: false,
                options: {
                    temperature,
                },
            };

            // Use format: 'json' for structured JSON output (native Ollama format)
            if (json) {
                requestBody.format = 'json';
            }

            const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify(requestBody),
            });

            // Handle rate limiting
            if (response.status === 429) {
                const retryAfter = response.headers.get('retry-after');
                const cooldownMs = retryAfter
                    ? parseInt(retryAfter) * 1000
                    : OLLAMA_CONFIG.sessionResetHours * 60 * 60 * 1000;
                keyManager.markExhausted(apiKey, cooldownMs);
                lastError = new Error(`Rate limited (429). Key rotated.`);
                continue; // Try next key
            }

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(`Ollama API error (${response.status}): ${errorText}`);
            }

            const data = await response.json();

            // Ollama native format returns: { message: { role, content } }
            const content = data?.message?.content || data?.choices?.[0]?.message?.content;
            if (!content) {
                throw new Error('Empty response from Ollama API');
            }

            return content.trim();
        } catch (error: any) {
            lastError = error;

            // If it's a rate limit error, the loop already continues
            if (error.message?.includes('Rate limited')) continue;

            // For network errors, retry with next key
            if (attempt < maxRetries) {
                console.warn(`⚠ Ollama request failed (attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}`);
                continue;
            }
        }
    }

    throw lastError || new Error('All Ollama API attempts failed');
}

/**
 * Send a chat request and parse the response as JSON.
 */
export async function ollamaChatJSON<T = any>(
    messages: ChatMessage[],
    options: Omit<OllamaOptions, 'json'> = {}
): Promise<T> {
    const response = await ollamaChat(messages, { ...options, json: true });
    try {
        return JSON.parse(response) as T;
    } catch (e) {
        // Sometimes LLMs wrap JSON in markdown code blocks
        const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned) as T;
    }
}

/**
 * Get the current status of API key availability.
 */
export function getKeyStatus() {
    return keyManager.getStatus();
}
