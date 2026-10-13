import type { IncomingMessage, ServerResponse } from 'http';
import app from '../backend/src/app';

/**
 * Serverless function entrypoint for Vercel Functions.
 * Handles all incoming /api/* requests by delegating to the Express application.
 */
export default function handler(req: IncomingMessage, res: ServerResponse) {
  return app(req, res);
}
