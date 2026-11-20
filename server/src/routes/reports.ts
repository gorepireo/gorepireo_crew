import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/reports/attendance
router.get('/attendance', authMiddleware, requireRole(['ADMIN', 'TEAM_LEADER']), (req: Request, res: Response) => {
  const { startDate, endDate, teamId, workerId } = req.query;

  let records = db.getAttendance();

  // Team leader scope
  if (req.user?.role === 'TEAM_LEADER' && req.user.managedTeamIds) {
    records = records.filter(r => r.teamId && req.user?.managedTeamIds?.includes(r.teamId));
  }

  if (teamId) {
    records = records.filter(r => r.teamId === teamId);
  }

  if (workerId) {
    records = records.filter(r => r.workerId === workerId);
  }

  if (startDate) {
    records = records.filter(r => r.date >= (startDate as string));
  }

  if (endDate) {
    records = records.filter(r => r.date <= (endDate as string));
  }

  const total = records.length;
  const present = records.filter(r => r.status === 'PRESENT').length;
  const absent = records.filter(r => r.status === 'ABSENT').length;
  const late = records.filter(r => r.status === 'LATE').length;
  const halfDay = records.filter(r => r.status === 'HALF_DAY').length;
  const leave = records.filter(r => r.status === 'APPROVED_LEAVE').length;

  const totalWorkingMinutes = records.reduce((acc, curr) => acc + (curr.workingMinutes || 0), 0);
  const averageHoursPerDay = total > 0 ? (totalWorkingMinutes / 60 / Math.max(1, present + halfDay)).toFixed(1) : 0;

  // Breakdown by team
  const teams = db.getTeams();
  const teamBreakdown = teams.map(t => {
    const tRecords = records.filter(r => r.teamId === t.teamId);
    return {
      teamId: t.teamId,
      teamName: t.name,
      total: tRecords.length,
      present: tRecords.filter(r => r.status === 'PRESENT').length,
      absent: tRecords.filter(r => r.status === 'ABSENT').length,
      rate: tRecords.length > 0 ? Math.round((tRecords.filter(r => r.status === 'PRESENT').length / tRecords.length) * 100) : 0,
    };
  });

  res.json({
    summary: {
      totalRecords: total,
      present,
      absent,
      late,
      halfDay,
      leave,
      attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
      totalWorkingHours: (totalWorkingMinutes / 60).toFixed(1),
      averageHoursPerDay,
    },
    teamBreakdown,
    records,
  });
});

// GET /api/reports/assignments
router.get('/assignments', authMiddleware, requireRole(['ADMIN', 'TEAM_LEADER']), (req: Request, res: Response) => {
  let assignments = db.getAssignments();

  if (req.user?.role === 'TEAM_LEADER' && req.user.managedTeamIds) {
    const managedTeams = req.user.managedTeamIds;
    assignments = assignments.filter(
      a => a.assignedBy === req.user?.uid || a.teamIds.some(t => managedTeams.includes(t))
    );
  }

  const total = assignments.length;
  const completed = assignments.filter(a => a.status === 'COMPLETED').length;
  const inProgress = assignments.filter(a => a.status === 'IN_PROGRESS').length;
  const assigned = assignments.filter(a => a.status === 'ASSIGNED').length;
  const cancelled = assignments.filter(a => a.status === 'CANCELLED').length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  res.json({
    summary: {
      total,
      completed,
      inProgress,
      assigned,
      cancelled,
      completionRate,
    },
    assignments,
  });
});

// GET /api/reports/export-csv
router.get('/export-csv', authMiddleware, requireRole(['ADMIN', 'TEAM_LEADER']), (req: Request, res: Response) => {
  let records = db.getAttendance();

  if (req.user?.role === 'TEAM_LEADER' && req.user.managedTeamIds) {
    records = records.filter(r => r.teamId && req.user?.managedTeamIds?.includes(r.teamId));
  }

  const headers = [
    'Attendance ID',
    'Worker ID',
    'Worker Name',
    'Team Name',
    'Date',
    'Check In Time',
    'Check Out Time',
    'Method',
    'Status',
    'Working Minutes',
    'GPS Distance (m)',
    'Verification Status',
    'Remarks',
  ];

  const escapeCSV = (str: any) => {
    if (str === null || str === undefined) return '';
    const stringVal = String(str).replace(/"/g, '""');
    return `"${stringVal}"`;
  };

  const rows = records.map(r => [
    escapeCSV(r.attendanceId),
    escapeCSV(r.workerId),
    escapeCSV(r.workerName),
    escapeCSV(r.teamName || 'Unassigned'),
    escapeCSV(r.date),
    escapeCSV(r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : ''),
    escapeCSV(r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : ''),
    escapeCSV(r.checkInMethod || ''),
    escapeCSV(r.status),
    escapeCSV(r.workingMinutes || 0),
    escapeCSV(r.checkInDistanceMeters !== undefined ? r.checkInDistanceMeters : ''),
    escapeCSV(r.verificationStatus),
    escapeCSV(r.remarks || ''),
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="workcrew-attendance-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.status(200).send(csvContent);
});

export default router;
