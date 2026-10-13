import { Router } from 'express';
import { getEarnings } from '../controllers/submission.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Creator fetches total earnings and stats
router.get('/earnings', authenticate, requireRole('creator'), getEarnings);

export default router;
