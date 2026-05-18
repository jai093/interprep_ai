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

// Path Reconstruction Middleware for Vercel
app.use((req, res, next) => {
  const pathParam = req.query.path;
  if (pathParam) {
    const urlParts = req.url.split('?');
    let queryString = '';
    if (urlParts[1]) {
      const searchParams = new URLSearchParams(urlParts[1]);
      searchParams.delete('path');
      const searchStr = searchParams.toString();
      queryString = searchStr ? '?' + searchStr : '';
    }
    req.url = '/api/' + pathParam + queryString;
  }
  next();
});

// Middleware
app.use(helmet());

// Configure CORS dynamically to support custom domains
app.use(cors((req, callback) => {
  const origin = req.header('Origin');
  const host = req.header('Host');

  const allowedOrigins = [
    process.env.CORS_ORIGIN,
    'https://interprepai-olive.vercel.app',
    'https://interprepai-five.vercel.app',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    'http://localhost:3000',
    'http://localhost:5173'
  ].filter(Boolean).map(s => String(s).split(',')).flat().map(s => s.trim());

  let isAllowed = false;
  if (!origin) {
    isAllowed = true;
  } else if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    isAllowed = true;
  } else if (origin.endsWith('.vercel.app')) {
    isAllowed = true;
  } else if (host && (origin === `https://${host}` || origin === `http://${host}`)) {
    isAllowed = true;
  }

  if (isAllowed) {
    callback(null, { origin: true, credentials: true });
  } else {
    callback(new Error(`Not allowed by CORS: ${origin}`));
  }
}));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

// Debug route
app.get('/api/debug', (req, res) => {
  res.json({
    status: 'ok',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      MONGODB_URI_DEFINED: !!process.env.MONGODB_URI,
      JWT_SECRET_DEFINED: !!process.env.JWT_SECRET,
    },
    dbState: mongoose.connection.readyState, // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
    timestamp: new Date().toISOString()
  });
});

// DB Connection Middleware - runs closer to request handling to ensure CORS headers are set
app.use(async (req, res, next) => {
  // Fail fast if URI is missing to prevent timeouts
  if (process.env.VERCEL && !process.env.MONGODB_URI) {
    console.error('CRITICAL: MONGODB_URI is missing in Vercel environment');
    return next(new Error('MONGODB_URI is missing in Vercel Environment Variables'));
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
    details: err.stack // ENABLED FOR DEBUGGING
  });
});

module.exports = app;
export default app;
