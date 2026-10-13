import { Router } from 'express';
import { create, listMine, updateViews } from '../controllers/submission.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Creator submits a post link
router.post('/', authenticate, requireRole('creator'), create);

// Creator lists their own submissions
router.get('/mine', authenticate, requireRole('creator'), listMine);

// Update submission views (Simulated platform webhook / crawler - no role check needed)
router.patch('/:id/views', updateViews);

export default router;
