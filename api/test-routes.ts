import { VercelRequest, VercelResponse } from '@vercel/node';
import authRoutes from '../backend/routes/authRoutes';
import candidateRoutes from '../backend/routes/candidateRoutes';
import recruiterRoutes from '../backend/routes/recruiterRoutes';
import assessmentRoutes from '../backend/routes/assessmentRoutes';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ status: 'All routes imported successfully!', time: new Date().toISOString() });
}
