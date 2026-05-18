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

    // Enforce a hard 3-second timeout on the Mongoose connection attempt to prevent Vercel 10s timeouts
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database Connection Timeout (3000ms exceeded). This usually means MongoDB Atlas is blocking Vercel. Please ensure you have whitelisted "0.0.0.0/0" (allow access from anywhere) in your MongoDB Atlas Network Access settings.')), 3000)
    );

    // Cache the connection promise so concurrent requests await the exact same operation
    cachedConnection = Promise.race([
      mongoose.connect(uri, {
        serverSelectionTimeoutMS: 2500,
        connectTimeoutMS: 2500,
        socketTimeoutMS: 2500,
      }),
      timeoutPromise
    ]);

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
