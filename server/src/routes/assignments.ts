import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';
import { generateAssignmentId } from '../utils/idGenerator';
import { Assignment, AssignmentMember, AssignmentPriority } from '../types';
import { reconcileMissedAttendance } from './attendance';

const router = Router();

// GET /api/assignments
router.get('/', authMiddleware, (req: Request, res: Response) => {
  reconcileMissedAttendance();
  const { date, workerId, teamId, status } = req.query;
  let assignments = db.getAssignments();

  // If worker, only show assignments they are part of
  if (req.user?.role === 'WORKER') {
    const worker = db.getWorkerByUserId(req.user.uid);
    const wid = worker ? worker.workerId : req.user.workerId;
    if (wid) {
      assignments = assignments.filter(a => a.workerIds.includes(wid));
    }
  }

  // If team leader, filter to their managed teams or workers
  if (req.user?.role === 'TEAM_LEADER' && req.user.managedTeamIds) {
    const managedTeams = req.user.managedTeamIds;
    // Show assignments where any assigned team is managed, or assignedBy is this leader
    assignments = assignments.filter(
      a =>
        a.assignedBy === req.user?.uid ||
        a.teamIds.some(t => managedTeams.includes(t)) ||
        req.user?.role === 'ADMIN'
    );
  }

  if (date) {
    assignments = assignments.filter(a => a.date === date);
  }

  if (workerId) {
    assignments = assignments.filter(a => a.workerIds.includes(workerId as string));
  }

  if (teamId) {
    assignments = assignments.filter(a => a.teamIds.includes(teamId as string));
  }

  if (status) {
    assignments = assignments.filter(a => a.status === status);
  }

  // Dynamically enrich assignments with location details and location photo URL from the database
  const enriched = assignments.map(a => {
    const loc = a.locationId ? db.getLocationById(a.locationId) : undefined;
    return {
      ...a,
      locationPhotoURL: a.locationPhotoURL || loc?.photoURL,
      locationName: a.locationName || loc?.name,
      locationAddress: a.locationAddress || loc?.address,
    };
  });

  res.json(enriched);
});

// GET /api/assignments/:id
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  const id = req.params.id as string;
  const assignment = db.getAssignmentById(id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  const members = db.getAssignmentMembers(assignment.assignmentId);
  const location = db.getLocationById(assignment.locationId);
  const workers = assignment.workerIds.map(wid => db.getWorkerById(wid)).filter(Boolean);
  const teams = assignment.teamIds.map(tid => db.getTeamById(tid)).filter(Boolean);

  res.json({
    ...assignment,
    locationPhotoURL: assignment.locationPhotoURL || location?.photoURL,
    locationName: assignment.locationName || location?.name,
    locationAddress: assignment.locationAddress || location?.address,
    location,
    members,
    workers,
    teams,
  });
});

// POST /api/assignments
router.post('/', authMiddleware, requireRole(['ADMIN', 'TEAM_LEADER']), async (req: Request, res: Response) => {
  const {
    title,
    description,
    locationId,
    teamIds,
    workerIds,
    date,
    startTime,
    endTime,
    priority,
    instructions,
  } = req.body;

  if (!title || !locationId || !date || !startTime || !endTime) {
    return res.status(400).json({ error: 'Title, location, date, start time, and end time are required' });
  }
  if (startTime >= endTime) {
    return res.status(400).json({ error: 'Scheduled end time must be after start time' });
  }

  await db.fetchTeamsFromTurso();
  await db.fetchLocationsFromTurso();
  const location = db.getLocationById(locationId);
  if (!location) return res.status(400).json({ error: 'Specified work location does not exist' });

  // Consolidate worker IDs from both explicit selection and team selection, avoiding duplicates
  const finalWorkerIds = new Set<string>(workerIds || []);
  const finalTeamIds = teamIds || [];

  if (finalTeamIds.length > 0) {
    const allWorkers = db.getWorkers();
    for (const tid of finalTeamIds) {
      const team = db.getTeamById(tid);
      if (team) {
        team.memberWorkerIds.forEach(wid => finalWorkerIds.add(wid));
      }
      allWorkers.forEach(w => {
        if (w.primaryTeamId === tid) finalWorkerIds.add(w.workerId);
      });
    }
  }

  if (finalWorkerIds.size === 0) {
    return res.status(400).json({ error: 'Must assign at least one worker or one team with active workers' });
  }

  const assignedWorkerList = Array.from(finalWorkerIds);
  const existingIds = db.getAssignments().map(a => a.assignmentId);
  const assignmentId = generateAssignmentId(existingIds);
  const now = new Date().toISOString();

  const newAssignment: Assignment = {
    assignmentId,
    title: title.trim(),
    description: description || '',
    locationId,
    locationName: location.name,
    locationAddress: location.address,
    locationLatitude: location.latitude,
    locationLongitude: location.longitude,
    locationPhotoURL: location.photoURL,
    assignedBy: req.user!.uid,
    assignedByName: req.user!.displayName,
    teamIds: finalTeamIds,
    workerIds: assignedWorkerList,
    date,
    startTime,
    endTime,
    priority: (priority as AssignmentPriority) || 'MEDIUM',
    status: 'ASSIGNED',
    instructions,
    createdAt: now,
    updatedAt: now,
  };

  db.addAssignment(newAssignment);

  // Create individual assignment membership records for attendance validation
  assignedWorkerList.forEach((wid, idx) => {
    const worker = db.getWorkerById(wid);
    const membership: AssignmentMember = {
      membershipId: `mem-${assignmentId}-${idx + 1}`,
      assignmentId,
      workerId: wid,
      teamId: worker?.primaryTeamId,
      individualStatus: 'ASSIGNED',
    };
    db.addAssignmentMember(membership);

    // Push notification to worker
    db.addNotification({
      notificationId: `notif-${Date.now()}-${idx}`,
      recipientId: wid,
      title: 'New Work Assignment',
      message: `You are assigned to "${title}" on ${date} (${startTime} - ${endTime}) at ${location.name}.`,
      type: 'ASSIGNMENT',
      read: false,
      relatedEntityId: assignmentId,
      createdAt: now,
    });
  });

  db.logActivity({
    logId: `log-${Date.now()}`,
    actorId: req.user!.uid,
    actorName: req.user!.displayName,
    actorRole: req.user!.role,
    action: 'CREATED_ASSIGNMENT',
    entityType: 'ASSIGNMENT',
    entityId: assignmentId,
    changes: { title, locationId, date, workerCount: assignedWorkerList.length },
    timestamp: now,
  });

  res.status(201).json(newAssignment);
});

// POST /api/assignments/:id/accept (Worker accepts)
router.post('/:id/accept', authMiddleware, (req: Request, res: Response) => {
  const id = req.params.id as string;
  const assignment = db.getAssignmentById(id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  let workerId = req.user?.workerId;
  if (!workerId && req.user?.role === 'WORKER') {
    const w = db.getWorkerByUserId(req.user.uid);
    if (w) workerId = w.workerId;
  }

  if (workerId) {
    const members = db.getAssignmentMembers(assignment.assignmentId, workerId);
    if (members.length > 0) {
      db.updateAssignmentMember(members[0].membershipId, {
        individualStatus: 'ACCEPTED',
        acceptedAt: new Date().toISOString(),
      });
    }
  }

  // If overall assignment was ASSIGNED, change to ACCEPTED or IN_PROGRESS
  if (assignment.status === 'ASSIGNED') {
    db.updateAssignment(assignment.assignmentId, { status: 'ACCEPTED' });
  }

  res.json({ success: true, message: 'Assignment accepted' });
});

// POST /api/assignments/:id/complete (Submit notes and evidence)
router.post('/:id/complete', authMiddleware, (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { completionNote, completionEvidenceUrl } = req.body;

  const assignment = db.getAssignmentById(id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  const now = new Date().toISOString();

  let workerId = req.user?.workerId;
  if (!workerId && req.user?.role === 'WORKER') {
    const w = db.getWorkerByUserId(req.user.uid);
    if (w) workerId = w.workerId;
  }

  if (workerId) {
    const members = db.getAssignmentMembers(assignment.assignmentId, workerId);
    if (members.length > 0) {
      db.updateAssignmentMember(members[0].membershipId, {
        individualStatus: 'COMPLETED',
        completedAt: now,
      });
    }
  }

  const updated = db.updateAssignment(assignment.assignmentId, {
    status: 'COMPLETED',
    completionNote: completionNote || 'Work completed successfully',
    completionEvidenceUrl,
  });

  db.logActivity({
    logId: `log-${Date.now()}`,
    actorId: req.user!.uid,
    actorName: req.user!.displayName,
    actorRole: req.user!.role,
    action: 'COMPLETED_ASSIGNMENT',
    entityType: 'ASSIGNMENT',
    entityId: assignment.assignmentId,
    changes: { completionNote },
    timestamp: now,
  });

  res.json(updated);
});

// PATCH /api/assignments/:id
router.patch('/:id', authMiddleware, requireRole(['ADMIN', 'TEAM_LEADER']), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const assignment = db.getAssignmentById(id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  const { title, description, status, priority, instructions } = req.body;
  const updates: Partial<Assignment> = {};
  if (title) updates.title = title.trim();
  if (description !== undefined) updates.description = description;
  if (status) updates.status = status;
  if (priority) updates.priority = priority;
  if (instructions !== undefined) updates.instructions = instructions;

  const updated = db.updateAssignment(assignment.assignmentId, updates);
  res.json(updated);
});

export default router;
