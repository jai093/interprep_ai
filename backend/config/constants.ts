import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

// --- JWT Configuration ---
const jwtSecret = process.env.JWT_SECRET;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

if (!jwtSecret || jwtSecret === 'change-this-to-a-random-64-char-hex-string') {
  throw new Error('FATAL: JWT_SECRET is not configured. Set a secure value in .env.local');
}
if (!jwtRefreshSecret || jwtRefreshSecret === 'change-this-to-a-different-random-64-char-hex-string') {
  throw new Error('FATAL: JWT_REFRESH_SECRET is not configured. Set a secure value in .env.local');
}

export const JWT_CONFIG = {
  secret: jwtSecret,
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshSecret: jwtRefreshSecret,
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
};

// --- Server Configuration ---
export const SERVER_CONFIG = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173',
};

// --- Ollama Cloud Configuration ---
// Collect all OLLAMA_API_KEY_* environment variables for round-robin
const ollamaKeys: string[] = [];
for (let i = 1; i <= 6; i++) {
  const key = process.env[`OLLAMA_API_KEY_${i}`];
  if (key) ollamaKeys.push(key);
}

if (ollamaKeys.length === 0) {
  console.warn('⚠ No OLLAMA_API_KEY_* found in environment. AI features will not work.');
}

export const OLLAMA_CONFIG = {
  keys: ollamaKeys,
  baseUrl: process.env.OLLAMA_BASE_URL || 'https://api.ollama.com',
  model: process.env.OLLAMA_MODEL || 'gpt-oss:120b',
  // Session reset timings (for round-robin scheduling awareness)
  sessionResetHours: 4,
  weeklyResetDays: 4,
};
