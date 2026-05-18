import { VercelRequest, VercelResponse } from '@vercel/node';
import authRoutes from '../backend/routes/authRoutes';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ status: 'authRoutes imported successfully!', time: new Date().toISOString() });
}
