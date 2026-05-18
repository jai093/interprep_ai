import { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../backend/config/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ status: 'connectDB imported successfully!', time: new Date().toISOString() });
}
