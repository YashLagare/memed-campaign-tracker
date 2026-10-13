import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '../models/User';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

const JWT_SECRET = process.env.JWT_SECRET || 'memed-development-jwt-secret-fallback-key-32chars';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: AuthTokenPayload): string {
  const secret = process.env.JWT_SECRET || JWT_SECRET;
  return jwt.sign(payload, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): AuthTokenPayload {
  const secret = process.env.JWT_SECRET || JWT_SECRET;
  return jwt.verify(token, secret) as AuthTokenPayload;
}
