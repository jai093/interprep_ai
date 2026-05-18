import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const log: string[] = [];

  function testRequire(name: string, fn: () => void) {
    try {
      log.push(`Loading ${name}...`);
      fn();
      log.push(`✓ ${name} loaded successfully!`);
    } catch (err: any) {
      log.push(`✗ ${name} failed to load! Error: ${err.message}`);
      if (err.stack) {
        log.push(`Stack: ${err.stack}`);
      }
    }
  }

  // Core dependencies
  testRequire('express', () => require('express'));
  testRequire('cors', () => require('cors'));
  testRequire('helmet', () => require('helmet'));
  testRequire('morgan', () => require('morgan'));
  testRequire('dotenv', () => require('dotenv'));
  testRequire('mongoose', () => require('mongoose'));

  // Backend config and files
  testRequire('db-config', () => require('../backend/config/db'));
  testRequire('constants-config', () => require('../backend/config/constants'));

  // Backend routes
  testRequire('authRoutes', () => require('../backend/routes/authRoutes'));
  testRequire('candidateRoutes', () => require('../backend/routes/candidateRoutes'));
  testRequire('recruiterRoutes', () => require('../backend/routes/recruiterRoutes'));
  testRequire('assessmentRoutes', () => require('../backend/routes/assessmentRoutes'));

  res.status(200).json({
    status: 'Static import test completed',
    log,
    time: new Date().toISOString()
  });
}
