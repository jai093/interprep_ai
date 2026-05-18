import { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ status: 'mongoose imported successfully!', state: mongoose.connection.readyState, time: new Date().toISOString() });
}
