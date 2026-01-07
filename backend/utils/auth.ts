import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/constants';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'candidate' | 'recruiter';
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_CONFIG.secret as jwt.Secret, {
    expiresIn: JWT_CONFIG.expiresIn as any,
  });
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_CONFIG.refreshSecret as jwt.Secret, {
    expiresIn: JWT_CONFIG.refreshExpiresIn as any,
  });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_CONFIG.secret) as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

export const verifyRefreshToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_CONFIG.refreshSecret) as JWTPayload;
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    return null;
  }
};
