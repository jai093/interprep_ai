import handler from './api/handler';
import { EventEmitter } from 'events';

// Mock Response to behave like a standard ServerResponse
class MockResponse extends EventEmitter {
    statusCode = 200;
    headersSent = false;

    status(code: number) {
        this.statusCode = code;
        console.log(`Response Status: ${code}`);
        return this;
    }

    json(data: any) {
        console.log('Response Data:', JSON.stringify(data, null, 2));
        return this;
    }

    setHeader(key: string, value: string) {
        // console.log(`Set Header: ${key}=${value}`);
    }

    getHeader(key: string) { return null; }
    removeHeader(key: string) { }
    write(chunk: any) { }
    end() { console.log('Response ended'); }
}

const req: any = {
    method: 'POST',
    url: '/api/auth/login',
    headers: {
        'content-type': 'application/json',
        'origin': 'http://localhost:3000'
    },
    body: {
        email: 'test@example.com',
        password: 'password123'
    },
    query: {},
    cookies: {}
};

const res: any = new MockResponse();

async function testHandler() {
    try {
        console.log('Starting Vercel Handler Simulation...');
        await handler(req, res);
    } catch (error) {
        console.error('CRITICAL ERROR CAUGHT:', error);
    }
}

testHandler();
