import express, { Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { SERVER_CONFIG } from './config/constants';
import { errorHandler } from './middleware/auth';

// Routes
import authRoutes from './routes/authRoutes';
import candidateRoutes from './routes/candidateRoutes';
import recruiterRoutes from './routes/recruiterRoutes';
import assessmentRoutes from './routes/assessmentRoutes';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app: Express = express();

// Middleware
app.use(helmet());
// Configure CORS to accept a comma-separated list of origins from env or constants
const rawOrigins = String(SERVER_CONFIG.corsOrigin || '');
const allowedOrigins = rawOrigins.split(',').map((s) => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // If no origin (e.g. same-origin requests, mobile apps, or curl), allow it
    if (!origin) return callback(null, true);

    // If wildcard is provided, allow all origins
    if (allowedOrigins.includes('*')) return callback(null, true);

    // Allow when origin is in the allowed list
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Otherwise reject
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/assessments', assessmentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Start server with graceful EADDRINUSE handling (try next available port)
const start = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start server
    let port = Number(SERVER_CONFIG.port) || 5000;

    const attemptListen = (p: number) => {
      const server = app.listen(p, () => {
        console.log(`✓ Server started on port ${p}`);
        console.log(`✓ API URL: http://localhost:${p}`);
        console.log(`✓ Environment: ${SERVER_CONFIG.nodeEnv}`);
      });

      server.on('error', (err: any) => {
        if (err && err.code === 'EADDRINUSE') {
          console.warn(`Port ${p} is in use. Trying port ${p + 1}...`);
          // small delay before retrying
          setTimeout(() => attemptListen(p + 1), 200);
          return;
        }
        console.error('Server error:', err);
        process.exit(1);
      });
    };

    attemptListen(port);
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

start();

export default app;
