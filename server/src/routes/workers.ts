import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { db } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';
import { generateWorkerId } from '../utils/idGenerator';
import { saveWorkerProfilePhoto, GOOGLE_DRIVE_WORKERS_FOLDER } from '../utils/fileStorage';
import { autoUploadWorkerPhotoToDrive } from '../utils/googleDriveSync';
import { indexPersonFace } from '../utils/facialRecognition';
import { Worker, User } from '../types';

const router = Router();

// GET /api/workers (Always reads live from Turso)
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const { teamId, status, search } = req.query;
  let workers = await db.fetchWorkersFromTurso();

  // If Team Leader, they can see workers of their managed teams or all workers if unassigned,
  // or all workers when explicitly searching to add an existing worker by ID or phone.
  if (req.user?.role === 'TEAM_LEADER' && req.user.managedTeamIds) {
    if (teamId) {
      if (!req.user.managedTeamIds.includes(teamId as string)) {
        return res.status(403).json({ error: 'You do not have access to this team' });
      }
    } else if (req.query.searchAll === 'true') {
      // Allow searching across all registered workers to add an existing worker
    } else {
      // Show workers in their managed teams + unassigned workers
      const managedTeams = req.user.managedTeamIds;
      workers = workers.filter(w => !w.primaryTeamId || managedTeams.includes(w.primaryTeamId));
    }
  }

  if (teamId) {
    workers = workers.filter(w => w.primaryTeamId === teamId);
  }

  if (status) {
    workers = workers.filter(w => w.status === status);
  }

  if (search) {
    const q = (search as string).toLowerCase();
    workers = workers.filter(
      w =>
        w.name.toLowerCase().includes(q) ||
        w.workerId.toLowerCase().includes(q) ||
        w.phone.includes(q) ||
        (w.email && w.email.toLowerCase().includes(q))
    );
  }

  res.json(workers);
});

// GET /api/workers/drive-config (Google Drive Worker Photos folder details & Anti-mixup scheme)
router.get('/drive-config', authMiddleware, (req: Request, res: Response) => {
  res.json({
    folderId: GOOGLE_DRIVE_WORKERS_FOLDER.id,
    folderUrl: GOOGLE_DRIVE_WORKERS_FOLDER.url,
    folderName: GOOGLE_DRIVE_WORKERS_FOLDER.name,
    description: GOOGLE_DRIVE_WORKERS_FOLDER.description,
    antiMixupNamingFormat: '{workerId}.jpg',
    driveCanonicalFormat: '{workerId}_{workerName}.jpg',
    antiMixupGuarantee: 'Each photo is deterministically mapped 1-to-1 to the unique Worker ID. Photos never clash, overwrite other workers, or get mixed up.',
  });
});

// GET /api/workers/unassigned
router.get('/unassigned', authMiddleware, requireRole(['ADMIN', 'TEAM_LEADER']), (req: Request, res: Response) => {
  const unassigned = db.getWorkers().filter(
    (w) => w.teamAssignmentStatus === 'UNASSIGNED' || !w.primaryTeamId
  );
  res.json(unassigned);
});

// GET /api/workers/:id
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  const id = req.params.id as string;
  const worker = db.getWorkerById(id) || db.getWorkerByUserId(id);
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  // Scoping check for team leader
  if (
    req.user?.role === 'TEAM_LEADER' &&
    worker.primaryTeamId &&
    req.user.managedTeamIds &&
    !req.user.managedTeamIds.includes(worker.primaryTeamId)
  ) {
    return res.status(403).json({ error: 'Worker is outside your managed teams' });
  }

  // If worker is requesting, can only view own profile
  if (req.user?.role === 'WORKER' && req.user.workerId !== worker.workerId && req.user.uid !== worker.userId) {
    return res.status(403).json({ error: 'Access denied: You can only view your own profile' });
  }

  // Fetch recent assignments and attendance history
  const assignments = db.getAssignments().filter(a => a.workerIds.includes(worker.workerId));
  const attendance = db.getAttendance().filter(a => a.workerId === worker.workerId);
  const team = worker.primaryTeamId ? db.getTeamById(worker.primaryTeamId) : null;

  res.json({
    worker,
    team,
    recentAssignments: assignments.slice(0, 10),
    attendanceSummary: {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'PRESENT').length,
      absent: attendance.filter(a => a.status === 'ABSENT').length,
      late: attendance.filter(a => a.status === 'LATE').length,
    },
    attendanceHistory: attendance.slice(0, 30),
  });
});

// POST /api/workers (Admin only)
router.post('/', authMiddleware, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  const { name, phone, email, address, primaryTeamId, joiningDate, photoURL, temporaryPassword, password } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Worker full name and mobile phone number are required' });
  }

  const finalTempPassword = temporaryPassword || password;
  if (!finalTempPassword || finalTempPassword.trim().length < 6) {
    return res.status(400).json({ error: 'Temporary password of at least 6 characters is required' });
  }

  const hasTeam = !!primaryTeamId && primaryTeamId.trim() !== '' && primaryTeamId !== 'NONE';

  // Validate Team Leader team authorization IF a team is specified
  if (hasTeam && req.user?.role === 'TEAM_LEADER') {
    const managedTeams = req.user.managedTeamIds || [];
    if (!managedTeams.includes(primaryTeamId)) {
      return res.status(403).json({ error: 'You are only authorized to add workers to your assigned teams.' });
    }
  }

  await db.fetchWorkersFromTurso();

  // Validate duplicate phone or email
  const existingUser = db.getUserByEmailOrPhone(phone.trim());
  if (existingUser) {
    return res.status(409).json({ error: 'A user account with this mobile phone number already exists' });
  }

  if (email && db.getUserByEmailOrPhone(email.trim())) {
    return res.status(409).json({ error: 'A user account with this email address already exists' });
  }

  // Generate unique sequential Worker ID WC-YYYY-001
  const existingWorkerIds = db.getWorkers().map((w) => w.workerId);
  const workerId = generateWorkerId(existingWorkerIds);
  const userId = `user-${workerId.toLowerCase()}`;
  const now = new Date().toISOString();

  let teamName: string | null = null;
  if (hasTeam) {
    const team = db.getTeamById(primaryTeamId);
    if (team) {
      teamName = team.name;
      // Add worker to team members list
      if (!team.memberWorkerIds.includes(workerId)) {
        db.updateTeam(primaryTeamId, {
          memberWorkerIds: [...team.memberWorkerIds, workerId],
        });
      }
    }
  }

  const passwordHash = bcrypt.hashSync(finalTempPassword.trim(), 10);

  // Anti-mixup photo handling: bound strictly to the workerId and Google Drive target folder
  const rawPhoto = req.body.photo || photoURL;
  let finalPhotoURL = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`;
  let savedPhotoMeta: any = null;
  if (rawPhoto && (rawPhoto.startsWith('data:image/') || rawPhoto.length > 200)) {
    finalPhotoURL = rawPhoto;
    try {
      savedPhotoMeta = saveWorkerProfilePhoto(rawPhoto, workerId, name);
    } catch (e: any) {
      console.warn('[WORKERS] Local photo disk save skipped:', e.message);
    }
  } else if (rawPhoto && (rawPhoto.startsWith('http://') || rawPhoto.startsWith('https://'))) {
    finalPhotoURL = rawPhoto;
  }

  const newUser: User = {
    uid: userId,
    role: 'WORKER',
    displayName: name.trim(),
    phone: phone.trim(),
    email: email ? email.trim() : undefined,
    photoURL: finalPhotoURL,
    active: true,
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

  const newWorker: Worker = {
    workerId,
    userId,
    name: name.trim(),
    phone: phone.trim(),
    email: email ? email.trim() : undefined,
    photoURL: finalPhotoURL,
    address: address ? address.trim() : undefined,
    primaryTeamId: hasTeam && primaryTeamId ? primaryTeamId : undefined,
    primaryTeamName: hasTeam && teamName ? teamName : undefined,
    teamAssignmentStatus: hasTeam ? 'ASSIGNED' : 'UNASSIGNED',
    joiningDate: joiningDate || now.slice(0, 10),
    status: 'ACTIVE',
    createdById: req.user!.uid,
    createdByName: req.user!.displayName,
    createdAt: now,
    updatedAt: now,
  };
  db.addWorker(newWorker);

  try {
    await Promise.all([
      db.persistUserToTurso(newUser),
      db.persistWorkerToTurso(newWorker),
    ]);
  } catch (err: any) {
    console.error('[WORKERS] Failed to persist worker to Turso:', err?.message);
    return res.status(500).json({ error: 'Failed to save worker account to database' });
  }

  // Automatic non-AI background upload to Google Drive
  if (savedPhotoMeta && savedPhotoMeta.filePath) {
    autoUploadWorkerPhotoToDrive(workerId, savedPhotoMeta.filePath, name)
      .then((driveRes) => {
        console.log(`[AUTO-DRIVE] Auto sync on creation for ${workerId}:`, driveRes.message);
      })
      .catch((err) => console.warn('[AUTO-DRIVE] Auto sync warning:', err.message));
  }

  // Audit log
  db.logActivity({
    logId: `log-${Date.now()}`,
    actorId: req.user!.uid,
    actorName: req.user!.displayName,
    actorRole: req.user!.role,
    action: 'REGISTERED_WORKER',
    entityType: 'WORKER',
    entityId: workerId,
    changes: {
      name,
      phone,
      teamId: hasTeam ? primaryTeamId : null,
      teamAssignmentStatus: newWorker.teamAssignmentStatus,
      creatorRole: req.user!.role,
    },
    timestamp: now,
  });

  res.status(201).json(newWorker);
});

// PATCH /api/workers/:id
router.patch('/:id', authMiddleware, requireRole(['ADMIN', 'TEAM_LEADER']), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const worker = db.getWorkerById(id);
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  const { name, phone, email, address, primaryTeamId, status } = req.body;
  const updates: Partial<Worker> = {};

  if (name) updates.name = name.trim();
  if (phone) updates.phone = phone.trim();
  if (email !== undefined) updates.email = email ? email.trim() : undefined;
  if (address !== undefined) updates.address = address;
  if (status) updates.status = status;

  if (primaryTeamId !== undefined) {
    // If team changed, update both teams' member lists
    if (worker.primaryTeamId && worker.primaryTeamId !== primaryTeamId) {
      const oldTeam = db.getTeamById(worker.primaryTeamId);
      if (oldTeam) {
        db.updateTeam(oldTeam.teamId, {
          memberWorkerIds: oldTeam.memberWorkerIds.filter(wid => wid !== worker.workerId),
        });
      }
    }

    if (primaryTeamId) {
      const newTeam = db.getTeamById(primaryTeamId);
      if (newTeam) {
        updates.primaryTeamId = primaryTeamId;
        updates.primaryTeamName = newTeam.name;
        if (!newTeam.memberWorkerIds.includes(worker.workerId)) {
          db.updateTeam(newTeam.teamId, {
            memberWorkerIds: [...newTeam.memberWorkerIds, worker.workerId],
          });
        }
      }
    } else {
      updates.primaryTeamId = undefined;
      updates.primaryTeamName = undefined;
    }
  }

  const updatedWorker = db.updateWorker(worker.workerId, updates);
  if (updatedWorker) {
    // Also sync user record
    db.updateUser(worker.userId, {
      displayName: updatedWorker.name,
      phone: updatedWorker.phone,
      email: updatedWorker.email,
    });

    db.logActivity({
      logId: `log-${Date.now()}`,
      actorId: req.user!.uid,
      actorName: req.user!.displayName,
      actorRole: req.user!.role,
      action: 'UPDATED_WORKER',
      entityType: 'WORKER',
      entityId: worker.workerId,
      changes: updates,
      timestamp: new Date().toISOString(),
    });
  }

  res.json(updatedWorker);
});

// POST /api/workers/:id/photo (Strict anti-mixup profile photo storage linked to Google Drive)
router.post('/:id/photo', authMiddleware, (req: Request, res: Response) => {
  const id = req.params.id as string;
  const worker = db.getWorkerById(id) || db.getWorkerByUserId(id);
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  // Workers can update their own photo; Leaders and Admins can update their workers
  if (req.user?.role === 'WORKER') {
    if (req.user.workerId !== worker.workerId && req.user.uid !== worker.userId) {
      return res.status(403).json({ error: 'You are only authorized to update your own profile photo' });
    }
  } else if (req.user?.role === 'TEAM_LEADER' && req.user.managedTeamIds && worker.primaryTeamId) {
    if (!req.user.managedTeamIds.includes(worker.primaryTeamId)) {
      return res.status(403).json({ error: 'Worker is outside your managed teams' });
    }
  }

  const { photo } = req.body;
  if (!photo) {
    return res.status(400).json({ error: 'Photo data (base64 image or URL) is required' });
  }

  // Save with strict deterministic workerId naming
  const saved = saveWorkerProfilePhoto(photo, worker.workerId, worker.name);

  // Immediately extract and index facial biometric features for group photo identification
  indexPersonFace(worker.workerId, worker.name, 'WORKER', saved.buffer, saved.publicUrl);

  // Update in DB (Worker record and User auth record)
  const updatedWorker = db.updateWorker(worker.workerId, {
    photoURL: saved.publicUrl,
  });

  db.updateUser(worker.userId, {
    photoURL: saved.publicUrl,
  });

  // Audit activity log
  db.logActivity({
    logId: `log-${Date.now()}`,
    actorId: req.user!.uid,
    actorName: req.user!.displayName,
    actorRole: req.user!.role,
    action: 'UPDATED_WORKER_PROFILE_PHOTO',
    entityType: 'WORKER',
    entityId: worker.workerId,
    changes: {
      photoURL: saved.publicUrl,
      googleDriveFolderId: saved.googleDriveFolderId,
      driveCanonicalFilename: saved.driveCanonicalFilename,
      antiMixupWorkerId: worker.workerId,
    },
    timestamp: new Date().toISOString(),
  });

  // Automatic non-AI background upload to Google Drive
  autoUploadWorkerPhotoToDrive(worker.workerId, saved.buffer, worker.name)
    .then((driveRes) => {
      console.log(`[AUTO-DRIVE] Auto sync for ${worker.workerId}:`, driveRes.message);
    })
    .catch((err) => console.warn('[AUTO-DRIVE] Background upload warning:', err.message));

  return res.json({
    success: true,
    worker: updatedWorker,
    photoURL: saved.publicUrl,
    googleDriveFolderId: saved.googleDriveFolderId,
    googleDriveFolderUrl: saved.googleDriveFolderUrl,
    driveCanonicalFilename: saved.driveCanonicalFilename,
    message: `Worker profile photo saved deterministically as ${saved.driveCanonicalFilename}`,
  });
});

// POST /api/workers/drive-sync-all (Automatic background batch sync of all worker photos to Google Drive)
router.post('/drive-sync-all', authMiddleware, requireRole(['ADMIN', 'TEAM_LEADER']), async (req: Request, res: Response) => {
  const workers = db.getWorkers();
  const results = [];

  for (const worker of workers) {
    const safeWorkerId = worker.workerId.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '_');
    const localPath = path.join(__dirname, '..', '..', 'uploads', 'workers', `${safeWorkerId}.jpg`);

    if (fs.existsSync(localPath)) {
      const driveRes = await autoUploadWorkerPhotoToDrive(worker.workerId, localPath, worker.name);
      results.push({
        workerId: worker.workerId,
        name: worker.name,
        result: driveRes,
      });
    }
  }

  res.json({
    message: `Processed automatic Google Drive sync for ${results.length} workers with local photos`,
    totalSynced: results.filter(r => r.result.synced).length,
    results,
  });
});

// PATCH /api/workers/:id/status
router.patch('/:id/status', authMiddleware, requireRole(['ADMIN', 'TEAM_LEADER']), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;

  if (!status || !['ACTIVE', 'INACTIVE', 'ON_LEAVE'].includes(status)) {
    return res.status(400).json({ error: 'Valid status is required: ACTIVE, INACTIVE, or ON_LEAVE' });
  }

  const worker = db.getWorkerById(id);
  if (!worker) return res.status(404).json({ error: 'Worker not found' });

  const updated = db.updateWorker(worker.workerId, { status });
  // Deactivate user login account if inactive
  db.updateUser(worker.userId, { active: status === 'ACTIVE' });

  db.logActivity({
    logId: `log-${Date.now()}`,
    actorId: req.user!.uid,
    actorName: req.user!.displayName,
    actorRole: req.user!.role,
    action: 'CHANGED_WORKER_STATUS',
    entityType: 'WORKER',
    entityId: worker.workerId,
    changes: { status },
    timestamp: new Date().toISOString(),
  });

  res.json(updated);
});

// POST /api/workers/:id/assign-team (Assign or reassign an unassigned/existing worker to an authorized team)
router.post('/:id/assign-team', authMiddleware, requireRole(['ADMIN', 'TEAM_LEADER']), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await db.fetchTeamsFromTurso();
  const worker = db.getWorkerById(id) || db.getWorkerByUserId(id);
  if (!worker) {
    return res.status(404).json({ error: 'Worker not found' });
  }

  const { teamId } = req.body;
  if (!teamId) {
    return res.status(400).json({ error: 'Team selection is required' });
  }

  // If requester is a Team Leader, ensure team is within their managed teams
  if (req.user?.role === 'TEAM_LEADER') {
    const managedTeams = req.user.managedTeamIds || [];
    if (!managedTeams.includes(teamId)) {
      return res.status(403).json({ error: 'You are only authorized to assign workers to your managed teams' });
    }
  }

  const team = db.getTeamById(teamId);
  if (!team) {
    return res.status(404).json({ error: 'Target team does not exist' });
  }

  // Remove from previous team if assigned
  if (worker.primaryTeamId && worker.primaryTeamId !== teamId) {
    const oldTeam = db.getTeamById(worker.primaryTeamId);
    if (oldTeam) {
      db.updateTeam(oldTeam.teamId, {
        memberWorkerIds: oldTeam.memberWorkerIds.filter((wid) => wid !== worker.workerId),
      });
    }
  }

  // Add to new team member list
  if (!team.memberWorkerIds.includes(worker.workerId)) {
    db.updateTeam(team.teamId, {
      memberWorkerIds: [...team.memberWorkerIds, worker.workerId],
    });
  }

  const updatedWorker = db.updateWorker(worker.workerId, {
    primaryTeamId: team.teamId,
    primaryTeamName: team.name,
    teamAssignmentStatus: 'ASSIGNED',
  });

  const latestTeam = db.getTeamById(team.teamId);
  if (latestTeam) await db.persistTeamToTurso(latestTeam);
  if (updatedWorker) await db.persistWorkerToTurso(updatedWorker);

  // Log activity
  db.logActivity({
    logId: `log-${Date.now()}`,
    actorId: req.user!.uid,
    actorName: req.user!.displayName,
    actorRole: req.user!.role,
    action: 'ASSIGNED_WORKER_TO_TEAM',
    entityType: 'WORKER',
    entityId: worker.workerId,
    changes: {
      teamId: team.teamId,
      teamName: team.name,
      previousTeamId: worker.primaryTeamId || null,
      teamAssignmentStatus: 'ASSIGNED',
    },
    timestamp: new Date().toISOString(),
  });

  return res.json(updatedWorker);
});

export default router;
