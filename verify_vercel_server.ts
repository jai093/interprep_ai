import express from 'express';
import handler from './api/handler';

const app = express();
const PORT = 5001;

// Use a middleware to delegate to the Vercel handler logic
// In Vercel, req/res are passed directly. 
// Our handler is: export default async (req: VercelRequest, res: VercelResponse) => { ... return app(req, res); }
// BUT, `handler.ts` exports a default function that *wraps* the express app.
// So we can just import the express app directly if exported, OR wrap the handler.

// Let's emulate the Vercel environment:
app.all('*', async (req, res) => {
    console.log(`[TEST] Received ${req.method} ${req.url}`);
    try {
        // The handler signature is (req, res). It internally calls an express app.
        // We need to cast because of Vercel types vs Express types mismatch in TS, but at runtime they are compatible.
        await handler(req as any, res as any);
    } catch (err) {
        console.error('[TEST] Handler crashed:', err);
        res.status(500).send('Handler Crashed');
    }
});

app.listen(PORT, () => {
    console.log(`Test server running at http://localhost:${PORT}`);

    // Auto-trigger a test request
    fetch(`http://localhost:${PORT}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
    })
        .then(r => r.text().then(t => console.log(`[TEST] Response (${r.status}):`, t)))
        .catch(e => console.error('[TEST] Request failed:', e))
        .finally(() => process.exit(0));
});
