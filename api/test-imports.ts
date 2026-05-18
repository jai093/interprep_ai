import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const log: string[] = [];
  
  function tryRequire(name: string, path: string) {
    try {
      log.push(`Loading ${name} from "${path}"...`);
      const mod = require(path);
      log.push(`✓ ${name} loaded successfully!`);
      return mod;
    } catch (err: any) {
      log.push(`✗ ${name} failed to load! Error: ${err.message}`);
      if (err.stack) {
        log.push(`Stack: ${err.stack}`);
      }
      return null;
    }
  }

  // Try to load core dependencies first
  tryRequire('express', 'express');
  tryRequire('cors', 'cors');
  tryRequire('helmet', 'helmet');
  tryRequire('morgan', 'morgan');
  tryRequire('dotenv', 'dotenv');
  tryRequire('mongoose', 'mongoose');
  
  // Try to load our backend files
  tryRequire('connectDB', '../backend/config/db');
  tryRequire('SERVER_CONFIG', '../backend/config/constants');
  
  // Try to load routes
  tryRequire('authRoutes', '../backend/routes/authRoutes');
  tryRequire('candidateRoutes', '../backend/routes/candidateRoutes');
  tryRequire('recruiterRoutes', '../backend/routes/recruiterRoutes');
  tryRequire('assessmentRoutes', '../backend/routes/assessmentRoutes');

  res.status(200).json({
    status: 'Import test completed',
    log,
    time: new Date().toISOString()
  });
}
