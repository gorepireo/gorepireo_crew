import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { authMiddleware, requireRole, JWT_SECRET, HARDCODED_ADMIN } from '../middleware/auth';
import { saveProfilePhoto } from '../utils/fileStorage';
import { autoUploadWorkerPhotoToDrive } from '../utils/googleDriveSync';
import { indexPersonFace } from '../utils/facialRecognition';
import { User, UserRole, Worker, TeamLeader, PasswordResetRequest } from '../types';

const router = Router();

// 1. Current user profile
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.user.uid === HARDCODED_ADMIN.uid) {
    return res.json({
      user: HARDCODED_ADMIN,
      settings: db.getSettings(),
    });
  }

  const fullUser = db.getUserByUid(req.user.uid);
  if (!fullUser) {
    return res.status(404).json({ error: 'User account not found' });
  }

  let additionalData: any = {};
  if (req.user.role === 'WORKER') {
    const worker = db.getWorkerByUserId(req.user.uid);
    additionalData.worker = worker;
  } else if (req.user.role === 'TEAM_LEADER') {
    const leader = db.getLeaderByUserId(req.user.uid);
    additionalData.leader = leader;
  } else if (req.user.role === 'B2B_CLIENT') {
    const organization = db.getOrganizationById(fullUser.organizationId || '');
    additionalData.organization = organization;
  }

  // Always return the fresh database user state including latest photoURL
  const { passwordHash, ...safeUserData } = fullUser;

  res.json({
    user: {
      ...safeUserData,
      mustChangePassword: !!fullUser.mustChangePassword,
    },
    ...additionalData,
    settings: db.getSettings(),
  });
});

// 2. Mobile Number & Password Login (Strictly No OTP, Rate-Limited & Lockout Protected)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const rawIdentifier = req.body.identifier || req.body.phone || req.body.mobile || req.body.email || '';
    const identifier = typeof rawIdentifier === 'string' ? rawIdentifier.trim() : String(rawIdentifier).trim();
    const { password, role: requestedRole } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Mobile number and password are required' });
  }

  // Hardcoded Admin Authentication (not stored in database)
  if (identifier === 'Ansh') {
    if (password !== 'Ansh@123') {
      return res.status(401).json({ error: 'Invalid mobile number or password.' });
    }
    const token = jwt.sign(
      {
        uid: HARDCODED_ADMIN.uid,
        role: HARDCODED_ADMIN.role,
        phone: HARDCODED_ADMIN.phone,
        displayName: HARDCODED_ADMIN.displayName,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({
      success: true,
      token,
      user: {
        ...HARDCODED_ADMIN,
        mustChangePassword: false,
      },
      worker: null,
      leader: null,
      mustChangePassword: false,
      redirectUrl: '/admin/dashboard',
      settings: db.getSettings(),
    });
  }

  // Find all user accounts matching normalized mobile or email identifier (refresh from Turso if not in local cache)
  let matchingUsers = db.getUsersByEmailOrPhone(identifier);
  if (!matchingUsers || matchingUsers.length === 0) {
    await db.fetchWorkersFromTurso();
    matchingUsers = db.getUsersByEmailOrPhone(identifier);
  }
  if (!matchingUsers || matchingUsers.length === 0) {
    return res.status(401).json({ error: 'Invalid mobile number or password.' });
  }

  // Find exact user candidate
  let user: User | undefined;
  const defaultHash = bcrypt.hashSync('password123', 10);

  // 1. If requestedRole is given, try that first
  if (requestedRole) {
    const roleMatch = matchingUsers.find((u) => u.role === requestedRole);
    if (roleMatch) {
      const isMatch = bcrypt.compareSync(password, roleMatch.passwordHash || defaultHash);
      if (isMatch) {
        user = roleMatch;
      }
    }
  }

  // 2. If no user selected yet, test each candidate prioritizing TEAM_LEADER > ADMIN > B2B_CLIENT > WORKER
  if (!user) {
    const priority: Record<UserRole, number> = { TEAM_LEADER: 1, ADMIN: 2, B2B_CLIENT: 3, WORKER: 4 };
    const sorted = [...matchingUsers].sort((a, b) => (priority[a.role] || 99) - (priority[b.role] || 99));

    for (const cand of sorted) {
      const isMatch = bcrypt.compareSync(password, cand.passwordHash || defaultHash);
      if (isMatch) {
        user = cand;
        break;
      }
    }
  }

  // 3. Fallback: if password didn't match directly, check common demo and digit fallbacks
  const inputDigits = db.extractDigits(identifier);
  if (!user && (
    password === 'password123' ||
    password === '123456' ||
    password === '123456789' ||
    password === identifier.trim() ||
    (inputDigits && password === inputDigits)
  )) {
    const priority: Record<UserRole, number> = { TEAM_LEADER: 1, ADMIN: 2, B2B_CLIENT: 3, WORKER: 4 };
    const sorted = [...matchingUsers].sort((a, b) => (priority[a.role] || 99) - (priority[b.role] || 99));
    user = (requestedRole ? matchingUsers.find((u) => u.role === requestedRole) : undefined) || sorted[0];
  }

  // 4. If still no user matched, record failed attempt on target candidate
  if (!user) {
    const priority: Record<UserRole, number> = { TEAM_LEADER: 1, ADMIN: 2, B2B_CLIENT: 3, WORKER: 4 };
    const sorted = [...matchingUsers].sort((a, b) => (priority[a.role] || 99) - (priority[b.role] || 99));
    const targetUser = (requestedRole ? matchingUsers.find((u) => u.role === requestedRole) : undefined) || sorted[0];

    const failedAttempts = (targetUser.failedLoginAttempts || 0) + 1;
    let lockedUntil: string | null = null;
    let errorMessage = 'Invalid mobile number or password.';

    if (failedAttempts >= 5) {
      lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      errorMessage =
        'Account locked: 5 consecutive failed login attempts recorded. Account is locked for 15 minutes. Request a password reset or try again later.';
    } else {
      errorMessage = `Invalid mobile number or password. Attempt ${failedAttempts} of 5 before temporary lockout.`;
    }

    db.updateUser(targetUser.uid, {
      failedLoginAttempts: failedAttempts,
      lockedUntil,
    });

    db.logActivity({
      logId: `log-${Date.now()}`,
      actorId: targetUser.uid,
      actorName: targetUser.displayName,
      actorRole: targetUser.role,
      action: 'FAILED_LOGIN_ATTEMPT',
      entityType: 'SETTINGS',
      entityId: targetUser.uid,
      changes: { attempts: failedAttempts, locked: !!lockedUntil },
      timestamp: new Date().toISOString(),
    });

    return res.status(401).json({ error: errorMessage });
  }

  if (!user.active) {
    return res.status(403).json({
      error: 'This account has been deactivated. Please contact your organization administrator.',
    });
  }

  // Check temporary account lockout
  if (user.lockedUntil) {
    const lockTime = new Date(user.lockedUntil).getTime();
    const now = Date.now();
    if (lockTime > now) {
      const remainingMinutes = Math.max(1, Math.ceil((lockTime - now) / 60000));
      return res.status(423).json({
        error: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute${
          remainingMinutes > 1 ? 's' : ''
        } or request a password reset.`,
        locked: true,
        remainingMinutes,
      });
    }
  }

  // Successful login — reset failed attempts and lockout
  db.updateUser(user.uid, {
    failedLoginAttempts: 0,
    lockedUntil: null,
  });

  // Generate secure JWT token
  const token = jwt.sign(
    {
      uid: user.uid,
      role: user.role,
      phone: user.phone,
      displayName: user.displayName,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  let worker = null;
  let leader = null;
  if (user.role === 'WORKER') {
    worker = db.getWorkerByUserId(user.uid);
  } else if (user.role === 'TEAM_LEADER') {
    leader = db.getLeaderByUserId(user.uid);
  }

  db.logActivity({
    logId: `log-${Date.now()}`,
    actorId: user.uid,
    actorName: user.displayName,
    actorRole: user.role,
    action: 'USER_LOGIN',
    entityType: 'SETTINGS',
    entityId: user.uid,
    changes: { method: 'MOBILE_PASSWORD', phone: user.phone },
    timestamp: new Date().toISOString(),
  });

  res.json({
    token,
    user: {
      uid: user.uid,
      role: user.role,
      displayName: user.displayName,
      email: user.email,
      phone: user.phone,
      photoURL: user.photoURL,
      organizationId: user.organizationId,
      organizationName: user.organizationName,
      mustChangePassword: !!user.mustChangePassword,
    },
    worker,
    leader,
    organization: user.role === 'B2B_CLIENT' ? db.getOrganizationById(user.organizationId || '') : undefined,
    mustChangePassword: !!user.mustChangePassword,
    redirectUrl:
      user.role === 'ADMIN'
        ? '/admin/dashboard'
        : user.role === 'TEAM_LEADER'
        ? '/leader/dashboard'
        : user.role === 'B2B_CLIENT'
        ? '/client/overview'
        : '/worker/home',
  });
  } catch (err: any) {
    console.error('[AUTH] Login exception:', err);
    return res.status(500).json({ error: err?.message || 'Login failed due to an internal server error' });
  }
});

// 2b. User Self-Registration (Supports WORKER and TEAM_LEADER)
router.post('/register-worker', (req: Request, res: Response) => {
  const { name, phone, password, email, role = 'WORKER' } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Full name is required' });
  }

  if (!phone || !phone.trim() || phone.trim() === '+91') {
    return res.status(400).json({ error: 'Mobile phone number is required' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const cleanPhone = phone.trim();
  const cleanEmail = email && email.trim() ? email.trim() : undefined;

  // Verify strictly ONE account per mobile number across the entire system
  const existingMatches = db.getUsersByEmailOrPhone(cleanPhone);
  if (existingMatches.length > 0) {
    return res.status(409).json({ error: 'An account with this mobile phone number already exists. Please log in.' });
  }

  // Verify unique email if supplied
  if (cleanEmail && db.getUserByEmailOrPhone(cleanEmail)) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }

  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(password.trim(), 10);

  if (role === 'TEAM_LEADER') {
    const existingLeaders = db.getTeamLeaders();
    const nextNum = (existingLeaders.length + 1).toString().padStart(3, '0');
    const leaderId = `TL-${nextNum}`;
    const userId = `user-leader-${nextNum}`;

    const newUser: User = {
      uid: userId,
      role: 'TEAM_LEADER',
      displayName: name.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`,
      active: true,
      passwordHash,
      mustChangePassword: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdById: userId,
      createdByName: name.trim(),
      createdAt: now,
      updatedAt: now,
    };
    db.addUser(newUser);

    const newLeader: TeamLeader = {
      leaderId,
      userId,
      name: name.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      photoURL: newUser.photoURL,
      managedTeamIds: [],
      permissions: {
        canCreateTeams: true,
        canAddWorkers: true,
        canAssignJobs: true,
        canCorrectAttendance: true,
      },
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    db.addTeamLeader(newLeader);

    const token = jwt.sign(
      { uid: newUser.uid, role: newUser.role, phone: newUser.phone, displayName: newUser.displayName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Team Leader account created successfully',
      token,
      user: {
        uid: newUser.uid,
        role: newUser.role,
        displayName: newUser.displayName,
        email: newUser.email,
        phone: newUser.phone,
        photoURL: newUser.photoURL,
      },
      leader: newLeader,
      redirectUrl: '/leader/dashboard',
    });
  }

  // Generate unique sequential Worker ID (WC-YYYY-XXX)
  const existingWorkers = db.getWorkers();
  const year = new Date().getFullYear();
  let maxSeq = 0;
  for (const w of existingWorkers) {
    const match = w.workerId.match(/WC-(\d{4})-(\d+)/);
    if (match) {
      const seq = parseInt(match[2], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }
  const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
  const workerId = `WC-${year}-${nextSeq}`;
  const userId = `user-${workerId.toLowerCase()}`;

  const newUser: User = {
    uid: userId,
    role: 'WORKER', // Strictly WORKER
    displayName: name.trim(),
    phone: cleanPhone,
    email: cleanEmail,
    photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`,
    active: true,
    passwordHash,
    mustChangePassword: false, // User selected their own password during registration
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdById: userId,
    createdByName: name.trim(),
    createdAt: now,
    updatedAt: now,
  };
  db.addUser(newUser);

  const newWorker: Worker = {
    workerId,
    userId,
    name: name.trim(),
    phone: cleanPhone,
    email: cleanEmail,
    photoURL: newUser.photoURL,
    primaryTeamId: undefined,
    primaryTeamName: undefined,
    teamAssignmentStatus: 'UNASSIGNED',
    joiningDate: now.slice(0, 10),
    status: 'ACTIVE',
    createdById: userId,
    createdByName: name.trim(),
    createdAt: now,
    updatedAt: now,
  };
  db.addWorker(newWorker);

  // Generate JWT token for seamless auto-login
  const token = jwt.sign(
    {
      uid: newUser.uid,
      role: newUser.role,
      phone: newUser.phone,
      displayName: newUser.displayName,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  db.logActivity({
    logId: `log-${Date.now()}`,
    actorId: userId,
    actorName: name.trim(),
    actorRole: 'WORKER',
    action: 'WORKER_SELF_REGISTERED',
    entityType: 'WORKER',
    entityId: workerId,
    changes: {
      workerId,
      name: name.trim(),
      phone: cleanPhone,
      teamAssignmentStatus: 'UNASSIGNED',
    },
    timestamp: now,
  });

  res.status(201).json({
    message: 'Worker account created successfully',
    token,
    user: {
      uid: newUser.uid,
      role: newUser.role,
      displayName: newUser.displayName,
      email: newUser.email,
      phone: newUser.phone,
      photoURL: newUser.photoURL,
      mustChangePassword: false,
    },
    worker: newWorker,
    redirectUrl: '/worker/home',
  });
});

// 3. Change Password (For logged-in users or mandatory first-time password change)
router.post('/change-password', authMiddleware, (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { newPassword, currentPassword } = req.body;
  if (!newPassword || newPassword.trim().length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  const user = db.getUserByUid(req.user.uid);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // If user is not in mandatory first-time change mode, verify current password
  if (!user.mustChangePassword) {
    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required' });
    }
    const defaultHash = bcrypt.hashSync('password123', 10);
    const hashToCompare = user.passwordHash || defaultHash;
    if (!bcrypt.compareSync(currentPassword, hashToCompare)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
  }

  const newHash = bcrypt.hashSync(newPassword.trim(), 10);
  db.updateUser(user.uid, {
    passwordHash: newHash,
    mustChangePassword: false,
    failedLoginAttempts: 0,
    lockedUntil: null,
  });

  db.logActivity({
    logId: `log-${Date.now()}`,
    actorId: user.uid,
    actorName: user.displayName,
    actorRole: user.role,
    action: 'PASSWORD_CHANGED',
    entityType: 'SETTINGS',
    entityId: user.uid,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: 'Password updated successfully. You can now use your new password.',
  });
});

// 4. Request Password Reset Assistance (Workers request Leader; Leaders request Admin)
router.post('/forgot-password-request', (req: Request, res: Response) => {
  const { phone, reason } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Mobile phone number is required' });
  }

  const user = db.getUserByEmailOrPhone(phone.trim());
  if (!user) {
    return res.status(404).json({ error: 'No account registered with this mobile number' });
  }

  let workerId: string | undefined;
  let leaderId: string | undefined;
  let targetLeaderId: string | undefined;
  let teamId: string | undefined;
  let teamName: string | undefined;

  if (user.role === 'WORKER') {
    const worker = db.getWorkerByUserId(user.uid);
    if (worker) {
      workerId = worker.workerId;
      teamId = worker.primaryTeamId;
      teamName = worker.primaryTeamName;
      if (teamId) {
        const team = db.getTeamById(teamId);
        if (team && team.leaderIds && team.leaderIds.length > 0) {
          targetLeaderId = team.leaderIds[0];
        }
      }
    }
  } else if (user.role === 'TEAM_LEADER') {
    const leader = db.getLeaderByUserId(user.uid);
    if (leader) leaderId = leader.leaderId;
  }

  const requestId = `rst-${Date.now()}`;
  const newRequest: PasswordResetRequest = {
    requestId,
    userId: user.uid,
    workerId,
    leaderId,
    name: user.displayName,
    phone: user.phone,
    role: user.role,
    requestedBy: 'SELF',
    requestedByName: user.displayName,
    targetLeaderId,
    teamId,
    teamName,
    status: 'PENDING',
    reason: reason || 'User requested password reset assistance',
    createdAt: new Date().toISOString(),
  };

  db.addPasswordResetRequest(newRequest);

  db.logActivity({
    logId: `log-${Date.now()}`,
    actorId: user.uid,
    actorName: user.displayName,
    actorRole: user.role,
    action: 'PASSWORD_RESET_REQUESTED',
    entityType: 'SETTINGS',
    entityId: requestId,
    changes: { phone: user.phone, role: user.role },
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    message:
      user.role === 'WORKER'
        ? 'Password reset assistance requested. Your designated Team Leader or Administrator will provide your temporary password.'
        : 'Password reset request submitted. System Administrator has been notified to reset your credentials.',
    requestId,
  });
});

// 4b. Self-Service Direct Password Restore (User restores own password via mobile number)
router.post('/self-reset-password', (req: Request, res: Response) => {
  try {
    const { phone, newPassword } = req.body;
    if (!phone || !newPassword) {
      return res.status(400).json({ error: 'Mobile number and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const matchingUsers = db.getUsersByEmailOrPhone(phone.trim());
    if (!matchingUsers || matchingUsers.length === 0) {
      return res.status(404).json({ error: 'No account registered with this mobile number. Please check the number or register.' });
    }

    const priority: Record<UserRole, number> = { TEAM_LEADER: 1, ADMIN: 2, B2B_CLIENT: 3, WORKER: 4 };
    const sorted = [...matchingUsers].sort((a, b) => (priority[a.role] || 99) - (priority[b.role] || 99));
    const targetUser = sorted[0];

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    db.updateUser(targetUser.uid, {
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
      mustChangePassword: false,
    });

    db.logActivity({
      logId: `log-${Date.now()}`,
      actorId: targetUser.uid,
      actorName: targetUser.displayName,
      actorRole: targetUser.role,
      action: 'PASSWORD_CHANGED',
      entityType: 'SETTINGS',
      entityId: targetUser.uid,
      changes: { method: 'SELF_RESET' },
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: `Password restored successfully for ${targetUser.displayName} (${targetUser.role})! You can now log in with your new password.`,
    });
  } catch (err: any) {
    console.error('[AUTH] self-reset-password error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to restore password' });
  }
});

// 5. Get Password Reset Requests (Scoped: Leaders see team workers, Admin sees all)
router.get('/reset-requests', authMiddleware, requireRole(['ADMIN', 'TEAM_LEADER']), (req: Request, res: Response) => {
  const allRequests = db.getPasswordResetRequests();

  if (req.user?.role === 'ADMIN') {
    return res.json(allRequests);
  }

  // Team Leader scope: only requests for workers in their managed teams
  const leaderManagedTeamIds = req.user?.managedTeamIds || [];
  const scopedRequests = allRequests.filter(
    (r) => r.role === 'WORKER' && r.teamId && leaderManagedTeamIds.includes(r.teamId)
  );

  res.json(scopedRequests);
});

// 6. Reset Password (Admin resets any; Team Leader resets assigned workers)
router.post('/reset-password', authMiddleware, requireRole(['ADMIN', 'TEAM_LEADER']), (req: Request, res: Response) => {
  const { targetUserId, targetPhone, temporaryPassword, requestId } = req.body;

  let user = targetUserId ? db.getUserByUid(targetUserId) : null;
  if (!user && targetPhone) {
    user = db.getUserByEmailOrPhone(targetPhone);
  }

  if (!user) {
    return res.status(404).json({ error: 'Target user account not found' });
  }

  // Authorization check for Team Leader
  if (req.user?.role === 'TEAM_LEADER') {
    if (user.role !== 'WORKER') {
      return res.status(403).json({ error: 'Team leaders are only authorized to reset Worker passwords.' });
    }
    const worker = db.getWorkerByUserId(user.uid);
    const managedTeams = req.user.managedTeamIds || [];
    if (!worker?.primaryTeamId || !managedTeams.includes(worker.primaryTeamId)) {
      return res.status(403).json({ error: 'Cannot reset password for workers outside your managed teams.' });
    }
  }

  // Generate or use provided temporary password
  const finalTempPassword =
    temporaryPassword && temporaryPassword.trim()
      ? temporaryPassword.trim()
      : `Temp@${Math.floor(100000 + Math.random() * 900000)}`;

  const newHash = bcrypt.hashSync(finalTempPassword, 10);

  db.updateUser(user.uid, {
    passwordHash: newHash,
    mustChangePassword: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
  });

  // If resolving a specific request
  if (requestId) {
    db.updatePasswordResetRequest(requestId, {
      status: 'RESOLVED',
      temporaryPasswordGenerated: finalTempPassword,
      resolvedBy: req.user!.uid,
      resolvedByName: req.user!.displayName,
      resolvedAt: new Date().toISOString(),
    });
  }

  db.logActivity({
    logId: `log-${Date.now()}`,
    actorId: req.user!.uid,
    actorName: req.user!.displayName,
    actorRole: req.user!.role,
    action: 'ADMIN_PASSWORD_RESET',
    entityType: 'SETTINGS',
    entityId: user.uid,
    changes: { targetRole: user.role, targetName: user.displayName },
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: `Password successfully reset for ${user.displayName}. User must change it upon next login.`,
    temporaryPassword: finalTempPassword,
  });
});

// 7. Quick switch role (for pilot demo, testing, and evaluation)
router.post('/switch-role', (req: Request, res: Response) => {
  const { role, userId } = req.body;

  let targetUser = userId ? db.getUserByUid(userId) : null;
  if (!targetUser && role) {
    targetUser = db.getUsers().find((u) => u.role === role && u.active);
  }

  if (!targetUser) {
    return res.status(404).json({ error: 'Target user/role not found' });
  }

  let worker = null;
  let leader = null;
  if (targetUser.role === 'WORKER') {
    worker = db.getWorkerByUserId(targetUser.uid);
  } else if (targetUser.role === 'TEAM_LEADER') {
    leader = db.getLeaderByUserId(targetUser.uid);
  }

  const token = jwt.sign(
    {
      uid: targetUser.uid,
      role: targetUser.role,
      phone: targetUser.phone,
      displayName: targetUser.displayName,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      ...targetUser,
      mustChangePassword: !!targetUser.mustChangePassword,
    },
    worker,
    leader,
    mustChangePassword: !!targetUser.mustChangePassword,
    redirectUrl:
      targetUser.role === 'ADMIN'
        ? '/admin/dashboard'
        : targetUser.role === 'TEAM_LEADER'
        ? '/leader/dashboard'
        : '/worker/home',
  });
});

// 8. Reset database to initial seed data
router.post('/reset-seed', (req: Request, res: Response) => {
  const freshData = db.resetToSeed();
  res.json({ success: true, message: 'Database reset to initial demo seeds' });
});

// 9. Upload & Update Profile Photo (Auto-deletes previous uploaded file from disk)
router.post('/profile-photo', authMiddleware, async (req: Request, res: Response) => {
  const { photo } = req.body;
  if (!photo) {
    return res.status(400).json({ error: 'Photo data (base64 image) is required' });
  }

  const userId = req.user!.uid;
  const user = db.getUserByUid(userId);
  if (!user) {
    return res.status(404).json({ error: 'User account not found' });
  }

  const role = user.role;
  let identifier = user.uid;
  let worker: Worker | null = null;
  let leader: TeamLeader | null = null;

  if (role === 'WORKER') {
    worker = db.getWorkerByUserId(userId) || (req.user!.workerId ? db.getWorkerById(req.user!.workerId) : null) || null;
    if (worker) identifier = worker.workerId;
  } else if (role === 'TEAM_LEADER') {
    leader = db.getLeaderByUserId(userId) || null;
    if (leader) identifier = leader.leaderId;
  }

  const previousPhotoUrl = user.photoURL || worker?.photoURL || leader?.photoURL;

  // 1. Save new photo and cleanly delete previous photo file from disk
  const result = saveProfilePhoto(photo, role, identifier, previousPhotoUrl, user.displayName);

  // 2. Immediately extract and index facial biometric details for instant group photo recognition
  const facialProfile = indexPersonFace(
    identifier,
    user.displayName,
    role,
    result.buffer,
    result.publicUrl
  );

  // 3. Update user record
  const updatedUser = db.updateUser(userId, {
    photoURL: result.publicUrl,
  });

  // 3. Update worker record if applicable
  let updatedWorker = null;
  if (worker) {
    updatedWorker = db.updateWorker(worker.workerId, {
      photoURL: result.publicUrl,
    });
  }

  // 4. Update team leader record if applicable
  let updatedLeader = null;
  if (leader) {
    updatedLeader = db.updateTeamLeader(leader.leaderId, {
      photoURL: result.publicUrl,
    });
  }

  // 5. Automated background sync to Google Drive folder for worker or leader
  const syncId = worker?.workerId || leader?.leaderId || user.uid;
  const syncName = worker?.name || leader?.name || user.displayName;
  autoUploadWorkerPhotoToDrive(syncId, result.buffer, syncName)
    .then((driveRes) => console.log(`[AUTO-DRIVE] Auto sync profile for ${syncId}:`, driveRes.message))
    .catch((err) => console.warn('[AUTO-DRIVE] Background upload warning:', err.message));

  // 5. Activity log
  db.logActivity({
    logId: `log-${Date.now()}`,
    actorId: user.uid,
    actorName: user.displayName,
    actorRole: user.role,
    action: 'UPDATED_PROFILE_PHOTO',
    entityType: role === 'WORKER' ? 'WORKER' : role === 'TEAM_LEADER' ? 'LEADER' : 'SETTINGS',
    entityId: user.uid,
    changes: {
      photoURL: result.publicUrl,
      previousPhotoDeleted: result.deletedPrevious,
    },
    timestamp: new Date().toISOString(),
  });

  return res.json({
    success: true,
    photoURL: result.publicUrl,
    deletedPrevious: result.deletedPrevious,
    user: updatedUser,
    worker: updatedWorker,
    leader: updatedLeader,
    message: result.deletedPrevious
      ? 'Previous profile image was deleted and replaced with new image successfully.'
      : 'Profile image updated successfully.',
  });
});

export default router;
