import { Request, Response, NextFunction } from 'express';
import { connectDB } from '../config/database';

export async function ensureDatabaseConnected(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('[db.middleware] Database connection failed:', error);
    res.status(503).json({
      error: 'Database connection failed. Please check your MongoDB configuration.',
    });
  }
}
