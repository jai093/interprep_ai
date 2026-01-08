import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../backend/config/db';
import { SERVER_CONFIG } from '../backend/config/constants';

// Routes
import authRoutes from '../backend/routes/authRoutes';
import candidateRoutes from '../backend/routes/candidateRoutes';
import recruiterRoutes from '../backend/routes/recruiterRoutes';
import assessmentRoutes from '../backend/routes/assessmentRoutes';

dotenv.config({ path: '.env.local' });

const app = express();

// Middleware
app.use(helmet());

// Configure CORS
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.CORS_ORIGIN,
      'https://interprepai-olive.vercel.app',
      'https://interprepai-five.vercel.app', // Explicitly add user's domain
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      'http://localhost:3000',
      'http://localhost:5173'
    ].filter(Boolean).map(s => String(s).split(',')).flat().map(s => s.trim());

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow any Vercel deployment subdomain
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
}));

// DB Connection Middleware - runs closer to request handling to ensure CORS headers are set
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return next();
  }
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database Connection Error:', error);
    next(error);
  }
});

app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/assessments', assessmentRoutes);

// 404 handler
app.use('/api*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled API Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default app;
