import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/notifications
router.get('/', authMiddleware, (req: Request, res: Response) => {
  let targetId = req.user?.uid;
  if (req.user?.role === 'WORKER') {
    const w = db.getWorkerByUserId(req.user.uid);
    if (w) targetId = w.workerId;
  }

  // Also include general system notifications
  const allNotifs = db.getNotifications();
  const userNotifs = allNotifs.filter(
    n => n.recipientId === targetId || n.recipientId === req.user?.uid || n.recipientId === 'ALL'
  );

  const unreadCount = userNotifs.filter(n => !n.read).length;

  res.json({
    notifications: userNotifs,
    unreadCount,
  });
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authMiddleware, (req: Request, res: Response) => {
  const id = req.params.id as string;
  const updated = db.updateNotification(id, { read: true });
  res.json(updated || { success: true });
});

// POST /api/notifications/mark-all
router.post('/mark-all', authMiddleware, (req: Request, res: Response) => {
  let targetId = req.user?.uid;
  if (req.user?.role === 'WORKER') {
    const w = db.getWorkerByUserId(req.user.uid);
    if (w) targetId = w.workerId;
  }

  const all = db.getNotifications();
  for (const n of all) {
    if (n.recipientId === targetId || n.recipientId === req.user?.uid) {
      db.updateNotification(n.notificationId, { read: true });
    }
  }

  res.json({ success: true, message: 'All notifications marked as read' });
});

export default router;
