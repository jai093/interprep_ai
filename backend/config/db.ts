import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

// Cache the active connection promise to prevent duplicate concurrent connection attempts in serverless environments
let cachedDbPromise: Promise<typeof mongoose> | null = null;

export const connectDB = async (): Promise<typeof mongoose> => {
  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // If currently connecting, return the existing active connection promise
  if (mongoose.connection.readyState === 2 && cachedDbPromise) {
    return cachedDbPromise;
  }

  const uri = process.env.MONGODB_URI || (process.env.VERCEL ? '' : 'mongodb://localhost:27017/interprepai');

  try {
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables. Please check your Vercel Project Settings.');
    }
    // Check if we are in production (Vercel) but using localhost URI
    if (process.env.NODE_ENV === 'production' && uri.includes('localhost')) {
      throw new Error('MONGODB_URI points to localhost in production/Vercel. Please set a valid Cloud MongoDB URI.');
    }

    // Cache the promise so concurrent calls await the exact same promise
    cachedDbPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    }).then((m) => {
      console.log('✓ MongoDB connected successfully');
      return m;
    }).catch((err) => {
      cachedDbPromise = null; // Clear the cache on failure so retry can happen
      console.error('✗ MongoDB connection failed:', err);
      throw err;
    });

    return cachedDbPromise;
  } catch (error) {
    console.error('✗ MongoDB connection pre-flight check failed:', error);
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
