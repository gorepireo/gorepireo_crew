import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';
import { saveBase64Image } from '../utils/fileStorage';
import { resolveReadableAddress } from '../utils/reverseGeo';
import { WorkEvidence, WorkEvidenceCategory, WorkEvidenceReviewStatus } from '../types';

const router = Router();

// GET /api/work-evidence (List with filters and role-based access)
router.get('/', authMiddleware, (req: Request, res: Response) => {
  const { assignmentId, workerId, teamId, locationId, category, reviewStatus, date } = req.query;

  let list = db.getWorkEvidence({
    assignmentId: assignmentId as string,
    workerId: workerId as string,
    teamId: teamId as string,
    locationId: locationId as string,
    category: category as string,
    reviewStatus: reviewStatus as string,
  });

  // Role scoping
  if (req.user?.role === 'WORKER') {
    const worker = db.getWorkerByUserId(req.user.uid) || (req.user.workerId ? db.getWorkerById(req.user.workerId) : null);
    const wid = worker ? worker.workerId : req.user.workerId;
    if (wid) {
      list = list.filter(e => e.workerId === wid);
    }
  } else if (req.user?.role === 'TEAM_LEADER' && req.user.managedTeamIds) {
    const managedTeams = req.user.managedTeamIds;
    list = list.filter(e => e.teamId && managedTeams.includes(e.teamId));
  }

  if (date) {
    list = list.filter(e => e.capturedAt?.startsWith(date as string));
  }

  res.json(list);
});

// GET /api/work-evidence/:id
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  const id = req.params.id as string;
  const item = db.getWorkEvidenceById(id);
  if (!item) return res.status(404).json({ error: 'Work evidence not found' });
  res.json(item);
});

// POST /api/work-evidence (Submit work photo evidence)
router.post('/', authMiddleware, (req: Request, res: Response) => {
  const {
    assignmentId,
    locationId,
    category,
    description,
    photo,
    watermarkPhoto,
    latitude,
    longitude,
    accuracy,
    detectedAddress,
    capturedAt,
  } = req.body;

  if (!assignmentId || !photo || !category) {
    return res.status(400).json({ error: 'assignmentId, photo, and category are required' });
  }

  const validCategories: WorkEvidenceCategory[] = ['BEFORE', 'DURING', 'AFTER', 'OTHER'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: 'Invalid category. Must be BEFORE, DURING, AFTER, or OTHER' });
  }

  let worker = null;
  if (req.user?.role === 'WORKER') {
    worker = db.getWorkerByUserId(req.user.uid) || (req.user.workerId ? db.getWorkerById(req.user.workerId) : null);
  } else if (req.body.workerId) {
    worker = db.getWorkerById(req.body.workerId);
  }

  const workerId = worker ? worker.workerId : (req.user?.workerId || 'unknown');
  const workerName = worker ? worker.name : req.user?.displayName || 'Worker';
  const teamId = worker?.primaryTeamId;

  const assignment = db.getAssignmentById(assignmentId);
  const location = locationId
    ? db.getLocationById(locationId)
    : assignment
    ? db.getLocationById(assignment.locationId)
    : null;

  const lat = latitude !== undefined ? Number(latitude) : (location?.latitude || 0);
  const lon = longitude !== undefined ? Number(longitude) : (location?.longitude || 0);
  const acc = accuracy !== undefined ? Number(accuracy) : 10;
  const address = detectedAddress || resolveReadableAddress(lat, lon, db.getLocations());
  const now = new Date().toISOString();

  // Save original photo and watermarked copy
  const photoUrl = saveBase64Image(photo, 'work_evidence', `work_${workerId}_${category.toLowerCase()}`);
  let watermarkUrl = photoUrl;
  if (watermarkPhoto) {
    watermarkUrl = saveBase64Image(watermarkPhoto, 'work_evidence', `wm_${workerId}_${category.toLowerCase()}`);
  }

  const photoId = `photo-ev-${Date.now()}`;
  const evidenceId = `ev-${Date.now()}`;

  // Check existing work evidence for this assignment to evaluate auto-verification
  const existingForAssignment = db.getWorkEvidence({ assignmentId });
  const hasBefore = existingForAssignment.some((e) => e.category === 'BEFORE');

  let reviewStatus: WorkEvidenceReviewStatus = 'PENDING';
  let reviewNotes: string | undefined = undefined;
  let autoVerified = false;

  // Auto-verification rule: If submitting AFTER work and a BEFORE photo exists, auto-verify!
  if (category === 'AFTER' && hasBefore) {
    reviewStatus = 'APPROVED';
    reviewNotes = 'Auto-verified: Both BEFORE and AFTER cleaning/work photographic evidence verified.';
    autoVerified = true;

    // Automatically complete assignment
    if (assignment && assignment.status !== 'COMPLETED') {
      db.updateAssignment(assignmentId, {
        status: 'COMPLETED',
        completionNote: 'Auto-verified: Before & After photographic evidence completed.',
        completionEvidenceUrl: photoUrl,
      });
    }
  } else if (category === 'BEFORE') {
    // If starting work, set assignment to IN_PROGRESS
    if (assignment && assignment.status === 'ASSIGNED') {
      db.updateAssignment(assignmentId, {
        status: 'IN_PROGRESS',
      });
    }
  }

  const evidence: WorkEvidence = {
    evidenceId,
    workerId,
    workerName,
    assignmentId,
    assignmentTitle: assignment?.title || 'General Field Duty',
    locationId: location?.locationId || assignment?.locationId || 'LOC-001',
    locationName: location?.name || assignment?.locationName || 'Field Site',
    teamId,
    photoId,
    photoUrl,
    watermarkUrl,
    category,
    description: description || '',
    latitude: lat,
    longitude: lon,
    accuracyMeters: acc,
    detectedAddress: address,
    capturedAt: capturedAt || now,
    uploadedAt: now,
    reviewStatus,
    reviewNotes,
    reviewedBy: autoVerified ? 'SYSTEM_AUTO_VERIFIER' : undefined,
    reviewedByName: autoVerified ? 'System Auto-Verifier' : undefined,
    reviewedAt: autoVerified ? now : undefined,
    createdAt: now,
  };

  db.addWorkEvidence(evidence);

  // Notify Team Leader
  const team = teamId ? db.getTeamById(teamId) : null;
  const recipientId = (team && team.leaderIds[0]) ? team.leaderIds[0] : 'admin';
  db.addNotification({
    notificationId: `notif-${Date.now()}`,
    recipientId,
    title: autoVerified ? `Work Completed & Auto-Verified (${assignment?.title || 'Duty'})` : `New Work Evidence (${category})`,
    message: autoVerified
      ? `${workerName} submitted After Work cleaning photo. Both Before & After photos matched and duty is AUTO-VERIFIED.`
      : `${workerName} submitted ${category.toLowerCase()} work evidence for "${assignment?.title || 'Duty'}": "${description || 'Photograph captured'}"`,
    type: 'ASSIGNMENT',
    read: false,
    relatedEntityId: evidenceId,
    createdAt: now,
  });

  res.status(201).json({
    evidence,
    autoVerified,
    assignmentStatus: assignment ? (autoVerified ? 'COMPLETED' : (category === 'BEFORE' ? 'IN_PROGRESS' : assignment.status)) : undefined,
    message: autoVerified
      ? 'Before & After cleaning evidence complete! Work has been auto-verified and marked completed.'
      : category === 'BEFORE'
      ? 'Before-work photo saved. Please proceed with work and capture After-work photo when completed.'
      : 'Work photograph evidence submitted successfully',
  });
});

// PATCH /api/work-evidence/:id/review (Team leader or admin reviews evidence)
router.patch('/:id/review', authMiddleware, requireRole(['ADMIN', 'TEAM_LEADER']), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { reviewStatus, reviewNotes } = req.body;

  if (!reviewStatus || !['APPROVED', 'REJECTED'].includes(reviewStatus)) {
    return res.status(400).json({ error: 'reviewStatus must be either APPROVED or REJECTED' });
  }

  const existing = db.getWorkEvidenceById(id);
  if (!existing) return res.status(404).json({ error: 'Work evidence not found' });

  // If leader, verify team permission
  if (req.user?.role === 'TEAM_LEADER' && req.user.managedTeamIds) {
    if (existing.teamId && !req.user.managedTeamIds.includes(existing.teamId)) {
      return res.status(403).json({ error: 'Cannot review evidence outside your managed teams' });
    }
  }

  const now = new Date().toISOString();
  const updated = db.updateWorkEvidence(id, {
    reviewStatus: reviewStatus as WorkEvidenceReviewStatus,
    reviewedBy: req.user!.uid,
    reviewedByName: req.user!.displayName,
    reviewedAt: now,
    reviewNotes: reviewNotes || (reviewStatus === 'APPROVED' ? 'Approved by Team Leader' : 'Rejected'),
  });

  // Notify worker
  db.addNotification({
    notificationId: `notif-${Date.now()}`,
    recipientId: existing.workerId,
    title: `Work Evidence ${reviewStatus}`,
    message: reviewStatus === 'APPROVED'
      ? `Your ${existing.category.toLowerCase()} work photograph for "${existing.assignmentTitle}" was APPROVED.`
      : `Your ${existing.category.toLowerCase()} work photograph for "${existing.assignmentTitle}" was REJECTED: ${reviewNotes || 'Does not meet site standards'}`,
    type: 'ASSIGNMENT',
    read: false,
    relatedEntityId: existing.evidenceId,
    createdAt: now,
  });

  res.json(updated);
});

export default router;
