import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { UserRole } from '../types';

export const JWT_SECRET = process.env.JWT_SECRET || 'workcrew-jwt-secret-secure-auth-2026';

export interface AuthenticatedUser {
  uid: string;
  role: UserRole;
  displayName: string;
  email?: string;
  phone?: string;
  managedTeamIds?: string[];
  workerId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Check standard headers or simulated role headers for seamless piloting/testing
  const authHeader = req.headers.authorization;
  const simulatedRole = req.headers['x-workcrew-role'] as UserRole | undefined;
  const simulatedUserId = req.headers['x-workcrew-user-id'] as string | undefined;

  // 1. If explicit simulated user/role header is provided (e.g., in UI role switcher)
  if (simulatedUserId) {
    const user = db.getUserByUid(simulatedUserId);
    if (user && user.active) {
      let managedTeamIds: string[] = [];
      let workerId: string | undefined;

      if (user.role === 'TEAM_LEADER') {
        const leader = db.getLeaderByUserId(user.uid);
        if (leader) managedTeamIds = leader.managedTeamIds;
      } else if (user.role === 'WORKER') {
        const worker = db.getWorkerByUserId(user.uid);
        if (worker) workerId = worker.workerId;
      }

      req.user = {
        uid: user.uid,
        role: user.role,
        displayName: user.displayName,
        email: user.email,
        phone: user.phone,
        managedTeamIds,
        workerId,
      };
      return next();
    }
  }

  // 2. If simulated role header without specific UID
  if (simulatedRole) {
    const defaultUser = db.getUsers().find(u => u.role === simulatedRole && u.active);
    if (defaultUser) {
      let managedTeamIds: string[] = [];
      let workerId: string | undefined;

      if (defaultUser.role === 'TEAM_LEADER') {
        const leader = db.getLeaderByUserId(defaultUser.uid);
        if (leader) managedTeamIds = leader.managedTeamIds;
      } else if (defaultUser.role === 'WORKER') {
        const worker = db.getWorkerByUserId(defaultUser.uid);
        if (worker) workerId = worker.workerId;
      }

      req.user = {
        uid: defaultUser.uid,
        role: defaultUser.role,
        displayName: defaultUser.displayName,
        email: defaultUser.email,
        phone: defaultUser.phone,
        managedTeamIds,
        workerId,
      };
      return next();
    }
  }

  // 3. Bearer token lookup (JWT verification with fallback)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const rawToken = authHeader.substring(7);
    let resolvedUid = rawToken;
    try {
      const decoded = jwt.verify(rawToken, JWT_SECRET) as any;
      if (decoded && decoded.uid) {
        resolvedUid = decoded.uid;
      }
    } catch {
      resolvedUid = rawToken;
    }

    const user = db.getUserByUid(resolvedUid) || db.getUsers().find(u => u.uid === resolvedUid);
    if (user && user.active) {
      let managedTeamIds: string[] = [];
      let workerId: string | undefined;

      if (user.role === 'TEAM_LEADER') {
        const leader = db.getLeaderByUserId(user.uid);
        if (leader) managedTeamIds = leader.managedTeamIds;
      } else if (user.role === 'WORKER') {
        const worker = db.getWorkerByUserId(user.uid);
        if (worker) workerId = worker.workerId;
      }

      req.user = {
        uid: user.uid,
        role: user.role,
        displayName: user.displayName,
        email: user.email,
        phone: user.phone,
        managedTeamIds,
        workerId,
      };
      return next();
    }
  }

  // Default fallback for development/first launch: Admin
  const adminUser = db.getUsers().find(u => u.role === 'ADMIN');
  if (adminUser) {
    req.user = {
      uid: adminUser.uid,
      role: 'ADMIN',
      displayName: adminUser.displayName,
      email: adminUser.email,
      phone: adminUser.phone,
      managedTeamIds: [],
    };
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized: Authentication required' });
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Access restricted to ${allowedRoles.join(', ')}`,
        currentRole: req.user.role,
      });
    }
    next();
  };
}

export function requireTeamScope(teamIdGetter: (req: Request) => string | undefined) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role === 'ADMIN') return next(); // Admin has universal scope

    if (req.user.role === 'TEAM_LEADER') {
      const targetTeamId = teamIdGetter(req);
      if (!targetTeamId) return next();
      if (!req.user.managedTeamIds || !req.user.managedTeamIds.includes(targetTeamId)) {
        return res.status(403).json({
          error: 'Forbidden: You do not have management authority over this team',
          authorizedTeams: req.user.managedTeamIds,
        });
      }
    }
    next();
  };
}
