import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/interprepai';

export const connectDB = async (): Promise<void> => {
  try {
    // Check if we are in production (Vercel) but using localhost URI
    if (process.env.NODE_ENV === 'production' && MONGODB_URI.includes('localhost')) {
      throw new Error('MONGODB_URI is not set or points to localhost in production mode. Please check your Vercel Environment Variables.');
    }

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✓ MongoDB connected successfully');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('✓ MongoDB disconnected successfully');
  } catch (error) {
    console.error('✗ MongoDB disconnection failed:', error);
  }
};

export default mongoose;
