import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';

const app: Express = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: "Meme'd Campaign Payout Tracker API",
    timestamp: new Date().toISOString()
  });
});

// Global 404 handler
app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found'
  });
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app;
