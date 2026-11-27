import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';
import { generateLeaderId } from '../utils/idGenerator';
import { TeamLeader, User } from '../types';

const router = Router();

// GET /api/leaders
router.get('/', authMiddleware, requireRole(['ADMIN', 'TEAM_LEADER']), (req: Request, res: Response) => {
  const leaders = db.getTeamLeaders();
  res.json(leaders);
});

// POST /api/leaders (Admin Creates Team Leader)
router.post('/', authMiddleware, requireRole(['ADMIN']), (req: Request, res: Response) => {
  const { name, phone, email, temporaryPassword, managedTeamIds, permissions, status, photoURL } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Full name and mobile phone number are required' });
  }

  if (!temporaryPassword || temporaryPassword.trim().length < 6) {
    return res.status(400).json({ error: 'Temporary password of at least 6 characters is required' });
  }

  // Check duplicate user phone or email
  if (db.getUserByEmailOrPhone(phone.trim())) {
    return res.status(409).json({ error: 'A user account with this mobile phone number already exists' });
  }
  if (email && db.getUserByEmailOrPhone(email.trim())) {
    return res.status(409).json({ error: 'A user account with this email address already exists' });
  }

  const existingLeaderIds = db.getTeamLeaders().map((l) => l.leaderId);
  const leaderId = generateLeaderId(existingLeaderIds);
  const userId = `user-${leaderId.toLowerCase()}`;
  const now = new Date().toISOString();

  const passwordHash = bcrypt.hashSync(temporaryPassword.trim(), 10);

  const newUser: User = {
    uid: userId,
    role: 'TEAM_LEADER',
    displayName: name.trim(),
    phone: phone.trim(),
    email: email ? email.trim() : undefined,
    photoURL: photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    active: status !== 'INACTIVE',
    passwordHash,
    mustChangePassword: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdById: req.user!.uid,
    createdByName: req.user!.displayName,
    createdAt: now,
    updatedAt: now,
  };
  db.addUser(newUser);

  const newLeader: TeamLeader = {
    leaderId,
    userId,
    name: name.trim(),
    phone: phone.trim(),
    email: email ? email.trim() : undefined,
    photoURL: newUser.photoURL,
    managedTeamIds: managedTeamIds || [],
    permissions: {
      canAddWorkers: permissions?.canAddWorkers ?? true,
      canAssignJobs: permissions?.canAssignJobs ?? true,
      canCorrectAttendance: permissions?.canCorrectAttendance ?? true,
      canCreateTeams: permissions?.canCreateTeams ?? true,
    },
    status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };
  db.addTeamLeader(newLeader);

  // Update teams that this leader manages
  if (managedTeamIds && Array.isArray(managedTeamIds)) {
    for (const tId of managedTeamIds) {
      const team = db.getTeamById(tId);
      if (team && !team.leaderIds.includes(leaderId)) {
        db.updateTeam(tId, { leaderIds: [...team.leaderIds, leaderId] });
      }
    }
  }

  db.logActivity({
    logId: `log-${Date.now()}`,
    actorId: req.user!.uid,
    actorName: req.user!.displayName,
    actorRole: req.user!.role,
    action: 'CREATED_TEAM_LEADER',
    entityType: 'LEADER',
    entityId: leaderId,
    changes: { name, phone, managedTeamIds, status: newLeader.status },
    timestamp: now,
  });

  res.status(201).json(newLeader);
});

// PATCH /api/leaders/:id
router.patch('/:id', authMiddleware, requireRole(['ADMIN']), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const leader = db.getLeaderById(id);
  if (!leader) return res.status(404).json({ error: 'Team leader not found' });

  const { name, phone, email, managedTeamIds, permissions, status } = req.body;
  const updates: Partial<TeamLeader> = {};

  if (name) updates.name = name.trim();
  if (phone) updates.phone = phone.trim();
  if (email !== undefined) updates.email = email ? email.trim() : undefined;
  if (managedTeamIds) updates.managedTeamIds = managedTeamIds;
  if (permissions) updates.permissions = { ...leader.permissions, ...permissions };
  if (status) updates.status = status;

  const updated = db.updateTeamLeader(leader.leaderId, updates);
  if (updated) {
    db.updateUser(leader.userId, {
      displayName: updated.name,
      phone: updated.phone,
      email: updated.email,
      active: updated.status === 'ACTIVE',
    });

    // Sync teams
    if (managedTeamIds && Array.isArray(managedTeamIds)) {
      const allTeams = db.getTeams();
      for (const t of allTeams) {
        const shouldBeIn = managedTeamIds.includes(t.teamId);
        const isIn = t.leaderIds.includes(leader.leaderId);
        if (shouldBeIn && !isIn) {
          db.updateTeam(t.teamId, { leaderIds: [...t.leaderIds, leader.leaderId] });
        } else if (!shouldBeIn && isIn) {
          db.updateTeam(t.teamId, { leaderIds: t.leaderIds.filter(lid => lid !== leader.leaderId) });
        }
      }
    }

    db.logActivity({
      logId: `log-${Date.now()}`,
      actorId: req.user!.uid,
      actorName: req.user!.displayName,
      actorRole: req.user!.role,
      action: 'UPDATED_TEAM_LEADER',
      entityType: 'LEADER',
      entityId: leader.leaderId,
      changes: updates,
      timestamp: new Date().toISOString(),
    });
  }

  res.json(updated);
});

// DELETE /api/leaders/:id (Admin Deletes Team Leader & associated user account)
router.delete('/:id', authMiddleware, requireRole(['ADMIN']), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const leader = db.getLeaderById(id);
  if (!leader) return res.status(404).json({ error: 'Team leader not found' });

  // Unassign from any managed teams
  const allTeams = db.getTeams();
  for (const t of allTeams) {
    if (t.leaderIds.includes(leader.leaderId)) {
      db.updateTeam(t.teamId, { leaderIds: t.leaderIds.filter(lid => lid !== leader.leaderId) });
    }
  }

  const deleted = db.deleteTeamLeader(leader.leaderId);

  db.logActivity({
    logId: `log-${Date.now()}`,
    actorId: req.user!.uid,
    actorName: req.user!.displayName,
    actorRole: req.user!.role,
    action: 'DELETED_TEAM_LEADER',
    entityType: 'LEADER',
    entityId: leader.leaderId,
    changes: { name: leader.name, phone: leader.phone },
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, message: 'Team leader deleted from system' });
});

export default router;
