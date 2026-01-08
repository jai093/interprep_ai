import http from 'http';
import app from './api/handler';

const PORT = 3001;

const server = http.createServer(app);

server.listen(PORT, async () => {
    console.log(`Test server running on port ${PORT}`);

    try {
        console.log('Sending test request to /api/health...');
        const healthRes = await fetch(`http://localhost:${PORT}/api/health`);
        console.log(`Health Status: ${healthRes.status}`);
        console.log('Health Body:', await healthRes.json());

        console.log('\nSending test request to /api/auth/login (expecting 401/400)...');
        // This should trigger the chain including helmet, cors, etc.
        const loginRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' })
        });

        console.log(`Login Status: ${loginRes.status}`);
        const loginData = await loginRes.json();
        console.log('Login Body:', loginData);

        if (loginRes.status === 401 || loginRes.status === 200 || loginRes.status === 400) {
            console.log('\nSUCCESS: Request handled without crashing.');
        } else {
            console.log('\nWARNING: Unexpected status code.');
        }

    } catch (error) {
        console.error('Test FAILED:', error);
    } finally {
        server.close(() => {
            console.log('Test server closed.');
        });
    }
});
