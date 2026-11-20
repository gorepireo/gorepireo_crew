import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/activity-logs
router.get('/', authMiddleware, requireRole(['ADMIN']), (req: Request, res: Response) => {
  const logs = db.getActivityLogs();
  res.json(logs);
});

export default router;
