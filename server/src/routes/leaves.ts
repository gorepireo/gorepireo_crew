import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';
import { LeaveRequest } from '../types';

const router = Router();

// GET /api/leaves
router.get('/', authMiddleware, (req: Request, res: Response) => {
  let list = db.getLeaveRequests();

  if (req.user?.role === 'WORKER') {
    const worker = db.getWorkerByUserId(req.user.uid);
    const wid = worker ? worker.workerId : req.user.workerId;
    if (wid) list = list.filter(l => l.workerId === wid);
  } else if (req.user?.role === 'TEAM_LEADER' && req.user.managedTeamIds) {
    list = list.filter(l => l.teamId && req.user?.managedTeamIds?.includes(l.teamId));
  }

  res.json(list);
});

// POST /api/leaves (Worker applies for leave)
router.post('/', authMiddleware, (req: Request, res: Response) => {
  const { startDate, endDate, leaveType, reason } = req.body;

  if (!startDate || !endDate || !reason) {
    return res.status(400).json({ error: 'Start date, end date, and reason are required' });
  }

  let worker = null;
  if (req.user?.role === 'WORKER') {
    worker = db.getWorkerByUserId(req.user.uid) || (req.user.workerId ? db.getWorkerById(req.user.workerId) : null);
  } else if (req.body.workerId) {
    worker = db.getWorkerById(req.body.workerId);
  }

  if (!worker) {
    return res.status(400).json({ error: 'Associated worker not found' });
  }

  const now = new Date().toISOString();
  const leaveId = `leave-${Date.now()}`;

  const newLeave: LeaveRequest = {
    leaveId,
    workerId: worker.workerId,
    workerName: worker.name,
    teamId: worker.primaryTeamId,
    startDate,
    endDate,
    leaveType: leaveType || 'CASUAL',
    reason,
    status: 'PENDING',
    createdAt: now,
  };

  db.addLeaveRequest(newLeave);

  // Notify team leader
  if (worker.primaryTeamId) {
    const team = db.getTeamById(worker.primaryTeamId);
    if (team && team.leaderIds.length > 0) {
      db.addNotification({
        notificationId: `notif-${Date.now()}`,
        recipientId: team.leaderIds[0],
        title: 'New Leave Request',
        message: `${worker.name} submitted a leave request from ${startDate} to ${endDate}.`,
        type: 'LEAVE',
        read: false,
        relatedEntityId: leaveId,
        createdAt: now,
      });
    }
  }

  res.status(201).json(newLeave);
});

// PATCH /api/leaves/:id (Approve/Reject)
router.patch('/:id', authMiddleware, requireRole(['ADMIN', 'TEAM_LEADER']), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status, reviewComment } = req.body;

  if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Valid status is required: APPROVED or REJECTED' });
  }

  const leave = db.getLeaveById(id);
  if (!leave) return res.status(404).json({ error: 'Leave request not found' });

  const updated = db.updateLeaveRequest(leave.leaveId, {
    status,
    reviewComment,
    reviewedBy: req.user!.displayName,
    reviewedAt: new Date().toISOString(),
  });

  // If approved, create approved leave attendance record
  if (status === 'APPROVED') {
    db.addAttendance({
      attendanceId: `att-leave-${Date.now()}`,
      workerId: leave.workerId,
      workerName: leave.workerName,
      workerCode: leave.workerId,
      teamId: leave.teamId,
      date: leave.startDate,
      status: 'APPROVED_LEAVE',
      verificationStatus: 'MANUAL_OVERRIDE',
      markedBy: req.user!.uid,
      markedByName: req.user!.displayName,
      remarks: `Leave approved: ${leave.reason}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Notify worker
  db.addNotification({
    notificationId: `notif-${Date.now()}`,
    recipientId: leave.workerId,
    title: `Leave Request ${status}`,
    message: `Your leave request for ${leave.startDate} to ${leave.endDate} was ${status.toLowerCase()} by ${req.user!.displayName}.`,
    type: 'LEAVE',
    read: false,
    relatedEntityId: leave.leaveId,
    createdAt: new Date().toISOString(),
  });

  res.json(updated);
});

export default router;
