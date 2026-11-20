import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/settings (Public organization branding and configuration)
router.get('/', (_req: Request, res: Response) => {
  res.json(db.getSettings());
});

// PATCH /api/settings
router.patch('/', authMiddleware, requireRole(['ADMIN']), (req: Request, res: Response) => {
  const updates = req.body;
  const updated = db.updateSettings(updates);

  db.logActivity({
    logId: `log-${Date.now()}`,
    actorId: req.user!.uid,
    actorName: req.user!.displayName,
    actorRole: req.user!.role,
    action: 'UPDATED_SETTINGS',
    entityType: 'SETTINGS',
    entityId: 'settings-root',
    changes: updates,
    timestamp: new Date().toISOString(),
  });

  res.json(updated);
});

export default router;
