import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

let cachedConnection: any = null;

export const connectDB = async (): Promise<typeof mongoose> => {
  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // If currently connecting, return the existing connection promise
  if (cachedConnection) {
    return cachedConnection;
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

    // Cache the connection promise so concurrent requests await the exact same operation
    cachedConnection = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    await cachedConnection;
    console.log('✓ MongoDB connected successfully');
    return mongoose;
  } catch (error) {
    cachedConnection = null; // Reset cache on failure so a future request can retry
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
