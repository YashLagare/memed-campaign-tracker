import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { ensureDatabaseConnected } from './middleware/db.middleware';
import authRoutes from './routes/auth.routes';
import campaignRoutes from './routes/campaign.routes';
import submissionRoutes from './routes/submission.routes';
import creatorRoutes from './routes/creator.routes';

const app: Express = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health check endpoint (does not require DB connection to return basic liveness)
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: "Meme'd Campaign Payout Tracker API",
    timestamp: new Date().toISOString(),
  });
});

// Mount database connection middleware for all functional API routes
app.use('/api', ensureDatabaseConnected);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/creators', creatorRoutes);

// Global 404 handler for API routes
app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
  });
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

export default app;
