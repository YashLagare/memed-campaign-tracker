import { Router } from 'express';
import { create, listLive, listMine, getById } from '../controllers/campaign.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Create new campaign (Brand only)
router.post('/', authenticate, requireRole('brand'), create);

// List active/live campaigns (Public / Creators)
router.get('/', listLive);

// List authenticated brand's own campaigns
router.get('/mine', authenticate, requireRole('brand'), listMine);

// Get single campaign details
router.get('/:id', getById);

export default router;
