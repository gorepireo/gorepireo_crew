import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';
import { Team } from '../types';

const router = Router();

// GET /api/teams
router.get('/', authMiddleware, (req: Request, res: Response) => {
  let teams = db.getTeams();

  // If team leader, optionally filter by managed teams or show all for assignment selection
  if (req.user?.role === 'TEAM_LEADER' && req.query.managedOnly === 'true' && req.user.managedTeamIds) {
    teams = teams.filter(t => req.user?.managedTeamIds?.includes(t.teamId));
  }

  // Enrich with leader info and worker count
  const enriched = teams.map(t => {
    const leaders = t.leaderIds.map(lid => db.getLeaderById(lid)).filter(Boolean);
    const workers = t.memberWorkerIds.map(wid => db.getWorkerById(wid)).filter(Boolean);
    return {
      ...t,
      leaders,
      workers,
      memberCount: t.memberWorkerIds.length,
    };
  });

  res.json(enriched);
});

// GET /api/teams/:id
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  const id = req.params.id as string;
  const team = db.getTeamById(id);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  const leaders = team.leaderIds.map(lid => db.getLeaderById(lid)).filter(Boolean);
  const workers = team.memberWorkerIds.map(wid => db.getWorkerById(wid)).filter(Boolean);
  const assignments = db.getAssignments().filter(a => a.teamIds.includes(team.teamId));

  // Today's team attendance
  const today = new Date().toISOString().slice(0, 10);
  const todayAttendance = db.getAttendance().filter(
    a => a.teamId === team.teamId && a.date === today
  );

  res.json({
    ...team,
    leaders,
    workers,
    assignments,
    todayAttendance,
  });
});

// POST /api/teams
router.post('/', authMiddleware, requireRole(['ADMIN', 'TEAM_LEADER']), (req: Request, res: Response) => {
  const { name, description, leaderIds, memberWorkerIds } = req.body;
  if (!name) return res.status(400).json({ error: 'Team name is required' });

  // If leader, check permission
  if (req.user?.role === 'TEAM_LEADER') {
    const leader = db.getLeaderByUserId(req.user.uid);
    if (!leader?.permissions.canCreateTeams) {
      return res.status(403).json({ error: 'Team leader is not authorized to create teams' });
    }
  }

  const existingTeams = db.getTeams();
  const nextNum = (existingTeams.length + 1).toString().padStart(3, '0');
  const teamId = `TM-${nextNum}`;
  const now = new Date().toISOString();

  // If leader created it, automatically include them in leaderIds
  let finalLeaders = leaderIds || [];
  if (req.user?.role === 'TEAM_LEADER') {
    const leader = db.getLeaderByUserId(req.user.uid);
    if (leader && !finalLeaders.includes(leader.leaderId)) {
      finalLeaders.push(leader.leaderId);
    }
  }

  const newTeam: Team = {
    teamId,
    name: name.trim(),
    description: description || '',
    leaderIds: finalLeaders,
    memberWorkerIds: memberWorkerIds || [],
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };
  db.addTeam(newTeam);

  // Update leaders' managedTeamIds
  for (const lid of finalLeaders) {
    const leader = db.getLeaderById(lid);
    if (leader && !leader.managedTeamIds.includes(teamId)) {
      db.updateTeamLeader(lid, { managedTeamIds: [...leader.managedTeamIds, teamId] });
    }
  }

  // Update worker primaryTeamId if assigned
  if (memberWorkerIds && Array.isArray(memberWorkerIds)) {
    for (const wid of memberWorkerIds) {
      db.updateWorker(wid, { primaryTeamId: teamId, primaryTeamName: name.trim() });
    }
  }

  db.logActivity({
    logId: `log-${Date.now()}`,
    actorId: req.user!.uid,
    actorName: req.user!.displayName,
    actorRole: req.user!.role,
    action: 'CREATED_TEAM',
    entityType: 'TEAM',
    entityId: teamId,
    changes: { name, leaderIds: finalLeaders, memberWorkerIds },
    timestamp: now,
  });

  res.status(201).json(newTeam);
});

// PATCH /api/teams/:id
router.patch('/:id', authMiddleware, requireRole(['ADMIN', 'TEAM_LEADER']), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const team = db.getTeamById(id);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  // Authorization check for team leaders
  if (req.user?.role === 'TEAM_LEADER' && (!req.user.managedTeamIds || !req.user.managedTeamIds.includes(team.teamId))) {
    return res.status(403).json({ error: 'Access denied: You do not manage this team' });
  }

  const { name, description, leaderIds, status } = req.body;
  const updates: Partial<Team> = {};
  if (name) updates.name = name.trim();
  if (description !== undefined) updates.description = description;
  if (leaderIds) updates.leaderIds = leaderIds;
  if (status) updates.status = status;

  const updated = db.updateTeam(team.teamId, updates);
  res.json(updated);
});

// POST /api/teams/:id/members (Add Existing Worker to Team)
router.post('/:id/members', authMiddleware, requireRole(['ADMIN', 'TEAM_LEADER']), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { workerId } = req.body;

  if (!workerId) {
    return res.status(400).json({ error: 'Worker ID, UID, or Mobile Number is required' });
  }

  const team = db.getTeamById(id);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  // Team Leader scope verification
  if (req.user?.role === 'TEAM_LEADER') {
    const managedTeams = req.user.managedTeamIds || [];
    if (!managedTeams.includes(team.teamId)) {
      return res.status(403).json({ error: 'Access denied: You do not have permission to manage this team' });
    }
  }

  // Resolve worker by workerId, userId (UID), or mobile phone
  const cleanId = String(workerId).trim();
  const worker =
    db.getWorkerById(cleanId) ||
    db.getWorkerByUserId(cleanId) ||
    db.getWorkers().find((w) => w.phone === cleanId || w.phone.replace(/\s+/g, '') === cleanId.replace(/\s+/g, ''));

  if (!worker) {
    return res.status(404).json({ error: `Worker not found matching identifier "${cleanId}"` });
  }

  if (worker.status !== 'ACTIVE') {
    return res.status(400).json({ error: `Cannot add worker: Account status is ${worker.status}. Only active workers can be assigned.` });
  }

  if (team.memberWorkerIds.includes(worker.workerId)) {
    return res.status(400).json({ error: `${worker.name} (${worker.workerId}) is already a member of ${team.name}` });
  }

  // If worker had a previous team, remove from previous team
  if (worker.primaryTeamId && worker.primaryTeamId !== team.teamId) {
    const oldTeam = db.getTeamById(worker.primaryTeamId);
    if (oldTeam) {
      db.updateTeam(oldTeam.teamId, {
        memberWorkerIds: oldTeam.memberWorkerIds.filter((w) => w !== worker.workerId),
      });
    }
  }

  // Add to new team memberWorkerIds
  const updatedTeam = db.updateTeam(team.teamId, {
    memberWorkerIds: [...team.memberWorkerIds, worker.workerId],
  });

  // Update worker primaryTeam and teamAssignmentStatus
  const updatedWorker = db.updateWorker(worker.workerId, {
    primaryTeamId: team.teamId,
    primaryTeamName: team.name,
    teamAssignmentStatus: 'ASSIGNED',
  });

  // Log to activity log
  db.logActivity({
    logId: `log-${Date.now()}`,
    actorId: req.user!.uid,
    actorName: req.user!.displayName,
    actorRole: req.user!.role,
    action: 'ASSIGNED_WORKER_TO_TEAM',
    entityType: 'TEAM',
    entityId: team.teamId,
    changes: {
      workerId: worker.workerId,
      workerName: worker.name,
      teamId: team.teamId,
      teamName: team.name,
    },
    timestamp: new Date().toISOString(),
  });

  res.json({ team: updatedTeam, worker: updatedWorker });
});

// DELETE /api/teams/:id/members/:workerId (Remove Worker from Team)
router.delete('/:id/members/:workerId', authMiddleware, requireRole(['ADMIN', 'TEAM_LEADER']), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const workerId = req.params.workerId as string;
  const team = db.getTeamById(id);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  // Team Leader scope verification
  if (req.user?.role === 'TEAM_LEADER') {
    const managedTeams = req.user.managedTeamIds || [];
    if (!managedTeams.includes(team.teamId)) {
      return res.status(403).json({ error: 'Access denied: You do not have permission to manage this team' });
    }
  }

  const cleanId = String(workerId).trim();
  const worker = db.getWorkerById(cleanId) || db.getWorkerByUserId(cleanId);
  if (!worker) return res.status(404).json({ error: 'Worker not found' });

  const updatedTeam = db.updateTeam(team.teamId, {
    memberWorkerIds: team.memberWorkerIds.filter((w) => w !== worker.workerId),
  });

  // Reset worker's primaryTeam and set back to UNASSIGNED (historical attendance/assignment records remain intact)
  if (worker.primaryTeamId === team.teamId) {
    db.updateWorker(worker.workerId, {
      primaryTeamId: undefined,
      primaryTeamName: undefined,
      teamAssignmentStatus: 'UNASSIGNED',
    });
  }

  // Log activity
  db.logActivity({
    logId: `log-${Date.now()}`,
    actorId: req.user!.uid,
    actorName: req.user!.displayName,
    actorRole: req.user!.role,
    action: 'REMOVED_WORKER_FROM_TEAM',
    entityType: 'TEAM',
    entityId: team.teamId,
    changes: {
      workerId: worker.workerId,
      workerName: worker.name,
      teamId: team.teamId,
      teamName: team.name,
    },
    timestamp: new Date().toISOString(),
  });

  res.json({ message: 'Worker successfully removed from team', team: updatedTeam });
});

export default router;
