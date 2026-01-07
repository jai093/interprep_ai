import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
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
const rawOrigins = String(process.env.CORS_ORIGIN || 'https://interprepai-olive.vercel.app');
const allowedOrigins = rawOrigins.split(',').map((s) => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*')) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

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

// Ensure DB is connected once
let dbConnected = false;

export default async (req: VercelRequest, res: VercelResponse) => {
  // Connect to DB on first request
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
      console.log('✓ Connected to MongoDB');
    } catch (error) {
      console.error('✗ Failed to connect to MongoDB:', error);
      return res.status(500).json({ error: 'Database connection failed' });
    }
  }

  return app(req, res);
};
