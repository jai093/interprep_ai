import { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ status: 'dotenv imported successfully!', time: new Date().toISOString() });
}
