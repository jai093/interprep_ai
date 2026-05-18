import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ status: 'express imported successfully!', time: new Date().toISOString() });
}
