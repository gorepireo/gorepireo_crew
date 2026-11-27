import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';
import { calculateHaversineDistance, validateGeofence } from '../utils/geo';
import { saveBase64Image } from '../utils/fileStorage';
import { resolveReadableAddress } from '../utils/reverseGeo';
import { verifyTeamAttendanceBiometrics } from '../utils/facialRecognition';
import { initializeFacialRecognitionIndex } from './recognition';
import {
  Attendance,
  AttendanceEvent,
  AttendancePhoto,
  AttendanceStatus,
  AttendanceMethod,
  GPSVerificationStatus,
} from '../types';

const router = Router();

export function getOrgLocalDateTime(timezone = 'Asia/Kolkata'): {
  dateStr: string;
  timeStr: string;
  totalMinutes: number;
} {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value || '00';
  const rawHour = get('hour');
  const hour = rawHour === '24' ? '00' : rawHour;
  const minute = get('minute');
  const dateStr = `${get('year')}-${get('month')}-${get('day')}`;
  const timeStr = `${hour}:${minute}`;
  return {
    dateStr,
    timeStr,
    totalMinutes: Number(hour) * 60 + Number(minute),
  };
}

/**
 * Reconciles past-due scheduled assignments: if an assignment's date has passed
 * (or its endTime has passed today) and an assigned worker has no attendance record
 * for that date, automatically marks them ABSENT in the database.
 */
function getDatesBetween(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return [startDate];
  for (let d = new Date(start); d <= end && dates.length < 60; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export function reconcileMissedAttendance(): number {
  const settings = db.getSettings();
  const { dateStr: today, timeStr: currentHHMM } = getOrgLocalDateTime(settings.timezone || 'Asia/Kolkata');
  const assignments = db.getAssignments();
  let markedCount = 0;

  for (const a of assignments) {
    if (a.status === 'CANCELLED' || a.status === 'COMPLETED' || a.status === 'NOT_DONE') continue;
    if (!a.date) continue;

    const effectiveEndDate = a.endDate && a.endDate >= a.date ? a.endDate : a.date;
    const allDates = getDatesBetween(a.date, effectiveEndDate);
    const workerIds = new Set<string>(a.workerIds || []);

    // Mark ABSENT for any scheduled day that has already passed (or ended today) without attendance
    for (const d of allDates) {
      const isDayPast = d < today;
      const isFinalDayEndedToday = d === today && d === effectiveEndDate && !!a.endTime && currentHHMM > a.endTime;
      if (!isDayPast && !isFinalDayEndedToday) continue;

      const allAttendance = db.getAttendance();
      for (const wid of workerIds) {
        const existing = allAttendance.find((att) => att.workerId === wid && att.date === d);
        if (existing) continue;

        const worker = db.getWorkerById(wid);
        if (!worker) continue;

        const now = new Date().toISOString();
        const absRecord: Attendance = {
          attendanceId: `att-abs-${d}-${wid}`,
          workerId: wid,
          workerName: worker.name,
          workerCode: worker.workerId,
          teamId: worker.primaryTeamId || a.teamIds?.[0],
          teamName: worker.primaryTeamName,
          assignmentId: a.assignmentId,
          assignmentTitle: a.title,
          date: d,
          status: 'ABSENT',
          verificationStatus: 'FLAGGED',
          photoStatus: 'MISSING',
          remarks: `Auto-marked ABSENT: Missed scheduled work "${a.title}" (${d} ${a.startTime || ''}–${a.endTime || ''})`,
          createdAt: now,
          updatedAt: now,
        };
        db.addAttendance(absRecord);
        markedCount++;

        db.addNotification({
          notificationId: `notif-abs-${d}-${wid}`,
          recipientId: wid,
          title: 'Missed Scheduled Work (Absent)',
          message: `You were marked ABSENT for "${a.title}" on ${d} (${a.startTime} - ${a.endTime}) because no check-in was recorded.`,
          type: 'ATTENDANCE',
          read: false,
          relatedEntityId: absRecord.attendanceId,
          createdAt: now,
        });
      }
    }

    // Only close the assignment once its full End Date + End Time has passed
    const isExpired =
      today > effectiveEndDate ||
      (today === effectiveEndDate && !!a.endTime && currentHHMM > a.endTime);
    if (!isExpired) continue;

    // Auto-close expired assignment: COMPLETED (Done) only if every scheduled day has valid attendance + Before & After images are uploaded; otherwise NOT_DONE
    const latestAttendance = db.getAttendance();
    const hasAllDaysAttendance = allDates.every((d) =>
      Array.from(workerIds).some((wid) =>
        latestAttendance.some(
          (att) =>
            att.workerId === wid &&
            att.date === d &&
            (att.status === 'PRESENT' || att.status === 'LATE' || att.status === 'CORRECTED')
        )
      )
    );
    const evidenceForJob = db.getWorkEvidence().filter((ev) => ev.assignmentId === a.assignmentId);
    const hasBeforePhoto = evidenceForJob.some((ev) => ev.category === 'BEFORE');
    const hasAfterPhoto = evidenceForJob.some((ev) => ev.category === 'AFTER');

    db.updateAssignment(a.assignmentId, {
      status: hasAllDaysAttendance && hasBeforePhoto && hasAfterPhoto ? 'COMPLETED' : 'NOT_DONE',
    });
  }

  return markedCount;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB limit

function validateBase64Image(dataUrl: string): { valid: boolean; error?: string } {
  if (typeof dataUrl !== 'string' || !dataUrl.trim()) {
    return { valid: false, error: 'Image payload is empty' };
  }
  const match = dataUrl.match(/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) {
    return { valid: false, error: 'Invalid image format. Only JPEG, PNG, or WebP base64 images are accepted.' };
  }
  const approxBytes = Math.ceil((match[2].length * 3) / 4);
  if (approxBytes > MAX_IMAGE_BYTES) {
    return { valid: false, error: 'Image size exceeds maximum allowed 10MB limit.' };
  }
  return { valid: true };
}

// GET /api/attendance (Always reads live from Turso)
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  await Promise.all([db.fetchAttendanceFromTurso(), db.fetchAssignmentsFromTurso(), db.fetchWorkersFromTurso()]);
  reconcileMissedAttendance();
  const { date, workerId, teamId, status } = req.query;
  let list = db.getAttendance();

  // If worker, only show their own attendance
  if (req.user?.role === 'WORKER') {
    const worker = db.getWorkerByUserId(req.user.uid);
    const wid = worker ? worker.workerId : req.user.workerId;
    if (wid) {
      list = list.filter(a => a.workerId === wid);
    }
  }

  // If team leader, filter by their managed teams
  if (req.user?.role === 'TEAM_LEADER' && req.user.managedTeamIds) {
    const managedTeams = req.user.managedTeamIds;
    list = list.filter(a => a.teamId && managedTeams.includes(a.teamId));
  }

  if (date) {
    list = list.filter(a => a.date === date);
  }

  if (workerId) {
    list = list.filter(a => a.workerId === workerId);
  }

  if (teamId) {
    list = list.filter(a => a.teamId === teamId);
  }

  if (status) {
    list = list.filter(a => a.status === status);
  }

  res.json(list);
});

// GET /api/attendance/history (convenience endpoint)
router.get('/history', authMiddleware, async (req: Request, res: Response) => {
  await Promise.all([db.fetchAttendanceFromTurso(), db.fetchAssignmentsFromTurso(), db.fetchWorkersFromTurso()]);
  reconcileMissedAttendance();
  let workerId = req.user?.workerId;
  if (!workerId && req.user?.role === 'WORKER') {
    const w = db.getWorkerByUserId(req.user.uid);
    if (w) workerId = w.workerId;
  }

  const wid = (req.query.workerId as string) || workerId;
  let records = db.getAttendance();
  if (wid) {
    records = records.filter(r => r.workerId === wid);
  }

  res.json(records);
});

// POST /api/attendance/group-verify (Group photo biometric verification + geofence + attendance marking)
router.post('/group-verify', authMiddleware, requireRole(['ADMIN', 'TEAM_LEADER']), async (req: Request, res: Response) => {
  try {
    const { teamId, assignmentId, locationId, date, photo, latitude, longitude, autoMark } = req.body;
    if (!photo) {
      return res.status(400).json({ error: 'Attendance photo is required' });
    }

    // Resolve active team
    let activeTeamId = teamId;
    if (!activeTeamId && req.user?.managedTeamIds && req.user.managedTeamIds.length > 0) {
      activeTeamId = req.user.managedTeamIds[0];
    }
    if (!activeTeamId) {
      const allTeams = db.getTeams();
      if (allTeams.length > 0) activeTeamId = allTeams[0].teamId;
    }

    const team = activeTeamId ? db.getTeamById(activeTeamId) : null;
    const teamName = team ? team.name : 'Active Site Crew';

    // 1. Strict Team Roster Scoping
    let teamWorkers = team
      ? db.getWorkers().filter(w => (w.primaryTeamId === team.teamId || team.memberWorkerIds?.includes(w.workerId)) && w.status !== 'INACTIVE')
      : [];
    if (teamWorkers.length === 0) {
      teamWorkers = db.getWorkers().filter(w => w.status !== 'INACTIVE');
    }
    if (teamWorkers.length === 0) {
      return res.status(400).json({ error: 'No active workers found in roster for attendance verification' });
    }

    // Ensure all registered worker profiles are indexed in biometric memory
    initializeFacialRecognitionIndex();

    // 2. Geofence & Location Validation
    let siteLocation = locationId ? db.getLocationById(locationId) : null;
    let activeAssignment = assignmentId ? db.getAssignmentById(assignmentId) : null;

    if (!siteLocation && activeAssignment) {
      siteLocation = db.getLocationById(activeAssignment.locationId);
    }

    let geoValidation = { isWithinGeofence: true, distanceMeters: 0 };
    let gpsStatus: GPSVerificationStatus = 'VERIFIED';

    if (siteLocation && latitude && longitude) {
      geoValidation = validateGeofence(
        Number(latitude),
        Number(longitude),
        siteLocation.latitude,
        siteLocation.longitude,
        siteLocation.geofenceRadiusMeters || 200
      );
      gpsStatus = geoValidation.isWithinGeofence ? 'VERIFIED' : 'OUTSIDE_GEOFENCE';
    }

    // 3. Strict 85% Biometric Verification scoped ONLY to this team
    const rosterForBiometrics = teamWorkers.map(w => ({ workerId: w.workerId, name: w.name }));
    const verification = verifyTeamAttendanceBiometrics(photo, rosterForBiometrics, 85.0);
    verification.teamId = teamId;

    const targetDate = date || new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();

    // 4. Save group photo proof
    const photoUrl = saveBase64Image(photo, 'attendance_photos', `group_${teamId}_${targetDate}`);

    // 5. If autoMark is requested, record attendance in database
    const markedRecords: any[] = [];
    if (autoMark) {
      for (const pw of verification.presentWorkers) {
        const worker = teamWorkers.find(w => w.workerId === pw.workerId)!;
        let att = db.getAttendance().find(a => a.workerId === pw.workerId && a.date === targetDate);
        if (att) {
          att = db.updateAttendance(att.attendanceId, {
            status: 'PRESENT',
            verificationStatus: 'VERIFIED',
            checkInPhotoUrl: photoUrl,
            gpsStatus,
          })!;
        } else {
          att = db.addAttendance({
            attendanceId: `att-grp-${Date.now()}-${pw.workerId}`,
            workerId: pw.workerId,
            workerName: worker.name,
            teamId: activeTeamId,
            teamName,
            assignmentId: activeAssignment?.assignmentId,
            assignmentTitle: activeAssignment?.title || 'Daily Scheduled Shift',
            date: targetDate,
            checkInTime: now,
            checkInMethod: 'GPS',
            checkInLatitude: latitude ? Number(latitude) : undefined,
            checkInLongitude: longitude ? Number(longitude) : undefined,
            checkInDistanceMeters: geoValidation.distanceMeters,
            checkInPhotoUrl: photoUrl,
            status: 'PRESENT',
            verificationStatus: 'VERIFIED',
            gpsStatus,
            createdAt: now,
            updatedAt: now,
          });
        }
        markedRecords.push(att);
      }

      // Explicitly mark absent members
      for (const aw of verification.absentWorkers) {
        const worker = teamWorkers.find(w => w.workerId === aw.workerId)!;
        let att = db.getAttendance().find(a => a.workerId === aw.workerId && a.date === targetDate);
        if (!att) {
          att = db.addAttendance({
            attendanceId: `att-grp-${Date.now()}-${aw.workerId}`,
            workerId: aw.workerId,
            workerName: worker.name,
            teamId: activeTeamId,
            teamName,
            assignmentId: activeAssignment?.assignmentId,
            assignmentTitle: activeAssignment?.title || 'Daily Scheduled Shift',
            date: targetDate,
            status: 'ABSENT',
            verificationStatus: 'FLAGGED',
            gpsStatus: 'UNAVAILABLE',
            createdAt: now,
            updatedAt: now,
          });
        }
        markedRecords.push(att);
      }
    }

    return res.json({
      success: true,
      teamId: activeTeamId,
      teamName,
      date: targetDate,
      location: siteLocation ? { name: siteLocation.name, geofenceValid: geoValidation.isWithinGeofence, distanceMeters: geoValidation.distanceMeters } : null,
      photoProofUrl: photoUrl,
      summary: {
        totalCrew: teamWorkers.length,
        presentCount: verification.presentWorkers.length,
        absentCount: verification.absentWorkers.length,
        ambiguousCount: verification.ambiguousWorkers.length,
        gpsStatus,
      },
      verification,
      markedRecords,
    });
  } catch (err: any) {
    console.error('[ATTENDANCE-GROUP-VERIFY] Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to process team attendance verification' });
  }
});

// POST /api/attendance/check-in (GPS Check-in with live selfie)
router.post('/check-in', authMiddleware, (req: Request, res: Response) => {
  const { assignmentId, latitude, longitude, accuracy, photo, detectedAddress, deviceTimestamp } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'GPS coordinates (latitude, longitude) are required for check-in' });
  }

  // Resolve current worker or leader
  let worker: any = null;
  if (req.user?.role === 'WORKER') {
    worker = db.getWorkerByUserId(req.user.uid) || (req.user.workerId ? db.getWorkerById(req.user.workerId) : null);
  } else if (req.body.workerId) {
    worker = db.getWorkerById(req.body.workerId);
  } else if (req.user?.role === 'TEAM_LEADER' || req.user?.role === 'ADMIN') {
    const leader = db.getLeaderByUserId(req.user.uid);
    if (leader) {
      worker = {
        workerId: leader.leaderId,
        userId: leader.userId,
        name: leader.name,
        phone: leader.phone,
        email: leader.email,
        photoURL: leader.photoURL,
        primaryTeamId: leader.managedTeamIds?.[0] || 'LEADER',
        primaryTeamName: 'Supervisors & Leaders',
        teamAssignmentStatus: 'ASSIGNED',
        status: 'ACTIVE',
      };
    }
  }

  if (!worker) {
    return res.status(400).json({ error: 'No associated worker or leader found for this check-in request' });
  }

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  // Check duplicate check-in today
  const existingToday = db.getAttendance().find(
    a => a.workerId === worker.workerId && a.date === today && a.checkInTime
  );

  if (existingToday) {
    return res.status(409).json({
      error: 'You have already checked in for today',
      attendance: existingToday,
    });
  }

  // Resolve assignment and target location
  let assignment = assignmentId ? db.getAssignmentById(assignmentId) : null;
  if (!assignment) {
    assignment = db.getAssignments().find(
      a => a.date === today && a.workerIds.includes(worker.workerId) && a.status !== 'CANCELLED'
    ) || null;
  }

  let targetLocation = assignment ? db.getLocationById(assignment.locationId) : null;
  if (!targetLocation) {
    targetLocation = db.getLocations()[0];
  }

  const settings = db.getSettings();
  const radius = targetLocation?.geofenceRadiusMeters || settings.defaultGeofenceRadiusMeters || 100;
  const maxAllowedAcc = settings.maxAllowedGPSAccuracyMeters || 50;

  const hasValidCoords =
    latitude !== undefined &&
    longitude !== undefined &&
    latitude !== null &&
    longitude !== null &&
    !isNaN(Number(latitude)) &&
    !isNaN(Number(longitude));

  const targetLat = targetLocation ? targetLocation.latitude : Number(latitude);
  const targetLon = targetLocation ? targetLocation.longitude : Number(longitude);

  const geoValidation = hasValidCoords
    ? validateGeofence(
        Number(latitude),
        Number(longitude),
        targetLat,
        targetLon,
        radius,
        accuracy ? Number(accuracy) : undefined
      )
    : { isWithinGeofence: false, distanceMeters: 0, message: 'GPS coordinates unavailable' };

  const acc = accuracy ? Number(accuracy) : 10;
  const accuracyAcceptable = hasValidCoords && acc <= maxAllowedAcc;
  const isVerified = hasValidCoords && accuracyAcceptable && geoValidation.isWithinGeofence;

  let gpsStatus: GPSVerificationStatus = 'VERIFIED';
  if (!hasValidCoords) {
    gpsStatus = 'UNAVAILABLE';
  } else if (!accuracyAcceptable) {
    gpsStatus = 'POOR_ACCURACY';
  } else if (!geoValidation.isWithinGeofence) {
    gpsStatus = 'OUTSIDE_GEOFENCE';
  }

  const resolvedAddress =
    detectedAddress ||
    (hasValidCoords ? resolveReadableAddress(Number(latitude), Number(longitude), db.getLocations()) : 'Location unavailable');

  // Validate and save photo if attached, plus optional biometric check
  let photoUrl: string | undefined;
  let photoRecord: AttendancePhoto | undefined;
  let biometricResult: { status: string; confidence: number } | undefined;

  if (photo) {
    const imgCheck = validateBase64Image(photo);
    if (!imgCheck.valid) {
      return res.status(400).json({ error: imgCheck.error });
    }

    initializeFacialRecognitionIndex();
    const bioCheck = verifyTeamAttendanceBiometrics(
      photo,
      [{ workerId: worker.workerId, name: worker.name }],
      85.0
    );
    if (bioCheck.presentWorkers.length > 0) {
      biometricResult = { status: 'VERIFIED', confidence: bioCheck.presentWorkers[0].confidence };
    } else if (bioCheck.ambiguousWorkers.length > 0) {
      biometricResult = { status: 'REVIEW_REQUIRED', confidence: bioCheck.ambiguousWorkers[0].confidence };
    } else if (bioCheck.absentWorkers[0]?.reason?.includes('No registered profile photo')) {
      biometricResult = { status: 'NOT_ENROLLED', confidence: 0 };
    } else {
      biometricResult = { status: 'MISMATCH', confidence: bioCheck.absentWorkers[0]?.confidence || 0 };
    }

    photoUrl = saveBase64Image(photo, 'attendance_photos', `selfie_in_${worker.workerId}`);
    const photoId = `photo-att-${Date.now()}`;
    photoRecord = {
      photoId,
      workerId: worker.workerId,
      workerName: worker.name,
      assignmentId: assignment?.assignmentId,
      assignmentTitle: assignment?.title,
      teamId: worker.primaryTeamId,
      photoType: 'CHECK_IN',
      storagePath: photoUrl,
      thumbnailPath: photoUrl,
      latitude: hasValidCoords ? Number(latitude) : 0,
      longitude: hasValidCoords ? Number(longitude) : 0,
      accuracyMeters: acc,
      detectedAddress: resolvedAddress,
      deviceCapturedAt: deviceTimestamp || now,
      serverUploadedAt: now,
      verificationStatus: gpsStatus,
      createdAt: now,
    };
    if (photoRecord) {
      db.addAttendancePhoto(photoRecord);
    }
  }

  // Calculate late arrival using organization timezone
  let status: AttendanceStatus = 'PRESENT';
  if (assignment?.startTime) {
    const [startH, startM] = assignment.startTime.split(':').map(Number);
    const graceMins = settings.lateArrivalGracePeriodMinutes || 15;
    const expectedMinutes = startH * 60 + startM + graceMins;
    const { totalMinutes: actualMinutes } = getOrgLocalDateTime(settings.timezone || 'Asia/Kolkata');
    if (actualMinutes > expectedMinutes) {
      status = 'LATE';
    }
  }

  const attendanceId = `att-${Date.now()}`;
  const newAttendance: Attendance = {
    attendanceId,
    workerId: worker.workerId,
    workerName: worker.name,
    workerCode: worker.workerId,
    teamId: worker.primaryTeamId,
    teamName: worker.primaryTeamName,
    assignmentId: assignment?.assignmentId,
    assignmentTitle: assignment?.title,
    date: today,
    checkInTime: now,
    checkInMethod: 'GPS',
    checkInLatitude: Number(latitude),
    checkInLongitude: Number(longitude),
    checkInAccuracy: acc,
    checkInDistanceMeters: geoValidation.distanceMeters,
    checkInAddress: resolvedAddress,
    checkInPhotoId: photoRecord?.photoId,
    checkInPhotoUrl: photoUrl,
    status,
    verificationStatus: isVerified ? 'VERIFIED' : 'FLAGGED',
    gpsStatus,
    photoStatus: photo ? 'SUBMITTED' : 'MISSING',
    remarks: geoValidation.message,
    createdAt: now,
    updatedAt: now,
  };

  db.addAttendance(newAttendance);

  // Record audit event
  const event: AttendanceEvent = {
    eventId: `evt-${Date.now()}`,
    attendanceId,
    workerId: worker.workerId,
    eventType: 'CHECK_IN',
    eventSource: 'WORKER_APP',
    actorId: req.user!.uid,
    actorName: req.user!.displayName,
    method: 'GPS',
    photoId: photoRecord?.photoId,
    photoUrl,
    timestamp: now,
    deviceTimestamp: deviceTimestamp || now,
    serverTimestamp: now,
    latitude: Number(latitude),
    longitude: Number(longitude),
    accuracyMeters: acc,
    detectedAddress: resolvedAddress,
    geofenceDistanceMeters: geoValidation.distanceMeters,
    verificationStatus: gpsStatus,
    location: {
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy: acc,
      distanceMeters: geoValidation.distanceMeters,
      detectedAddress: resolvedAddress,
    },
    reason: geoValidation.message,
    newValues: newAttendance,
  };
  db.addAttendanceEvent(event);

  if (assignment && assignment.status === 'ASSIGNED') {
    db.updateAssignment(assignment.assignmentId, { status: 'IN_PROGRESS' });
  }

  res.status(201).json({
    attendance: newAttendance,
    photo: photoRecord,
    geofence: geoValidation,
    biometric: biometricResult,
    message: isVerified
      ? 'Check-in verified successfully with photo on worksite'
      : `Check-in recorded with location flag (${geoValidation.distanceMeters}m from site)`,
  });
});

// POST /api/attendance/check-out (GPS Check-out with live selfie)
router.post('/check-out', authMiddleware, (req: Request, res: Response) => {
  const { attendanceId, latitude, longitude, accuracy, photo, detectedAddress, deviceTimestamp } = req.body;

  let workerId = req.user?.workerId;
  if (!workerId && req.user?.role === 'WORKER') {
    const w = db.getWorkerByUserId(req.user.uid);
    if (w) workerId = w.workerId;
  }
  if (!workerId && req.body.workerId) {
    workerId = req.body.workerId;
  }
  if (!workerId && (req.user?.role === 'TEAM_LEADER' || req.user?.role === 'ADMIN')) {
    const leader = db.getLeaderByUserId(req.user.uid);
    if (leader) workerId = leader.leaderId;
  }

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  let record: Attendance | undefined;
  if (attendanceId) {
    record = db.getAttendanceById(attendanceId);
  } else if (workerId) {
    record = db.getAttendance().find(
      a => a.workerId === workerId && a.date === today && !a.checkOutTime
    );
  }

  if (!record) {
    return res.status(404).json({ error: 'No active check-in record found for checkout today' });
  }

  if (record.checkOutTime) {
    return res.status(400).json({ error: 'Worker has already checked out for today', attendance: record });
  }

  // Calculate working minutes
  let workingMinutes = 0;
  if (record.checkInTime) {
    const inMs = new Date(record.checkInTime).getTime();
    const outMs = new Date(now).getTime();
    workingMinutes = Math.max(0, Math.round((outMs - inMs) / 60000));
  }

  // Calculate checkout distance
  let checkOutDistance: number | undefined;
  if (latitude !== undefined && longitude !== undefined && record.assignmentId) {
    const assignment = db.getAssignmentById(record.assignmentId);
    if (assignment) {
      const loc = db.getLocationById(assignment.locationId);
      if (loc) {
        checkOutDistance = calculateHaversineDistance(Number(latitude), Number(longitude), loc.latitude, loc.longitude);
      }
    }
  }

  const resolvedAddress = detectedAddress || (latitude ? resolveReadableAddress(Number(latitude), Number(longitude), db.getLocations()) : undefined);

  // Save checkout photo if attached
  let photoUrl: string | undefined;
  let photoRecord: AttendancePhoto | undefined;
  if (photo) {
    photoUrl = saveBase64Image(photo, 'attendance_photos', `selfie_out_${record.workerId}`);
    const photoId = `photo-att-${Date.now()}`;
    photoRecord = {
      photoId,
      workerId: record.workerId,
      workerName: record.workerName,
      assignmentId: record.assignmentId,
      assignmentTitle: record.assignmentTitle,
      teamId: record.teamId,
      photoType: 'CHECK_OUT',
      storagePath: photoUrl,
      thumbnailPath: photoUrl,
      latitude: latitude !== undefined ? Number(latitude) : 0,
      longitude: longitude !== undefined ? Number(longitude) : 0,
      accuracyMeters: accuracy ? Number(accuracy) : 10,
      detectedAddress: resolvedAddress || '',
      deviceCapturedAt: deviceTimestamp || now,
      serverUploadedAt: now,
      verificationStatus: 'VERIFIED',
      createdAt: now,
    };
    if (photoRecord) {
      db.addAttendancePhoto(photoRecord);
    }
  }

  const previousValues = { ...record };
  const updated = db.updateAttendance(record.attendanceId, {
    checkOutTime: now,
    checkOutMethod: 'GPS',
    checkOutLatitude: latitude !== undefined ? Number(latitude) : undefined,
    checkOutLongitude: longitude !== undefined ? Number(longitude) : undefined,
    checkOutAccuracy: accuracy !== undefined ? Number(accuracy) : undefined,
    checkOutDistanceMeters: checkOutDistance,
    checkOutAddress: resolvedAddress,
    checkOutPhotoId: photoRecord?.photoId,
    checkOutPhotoUrl: photoUrl,
    workingMinutes,
  });

  db.addAttendanceEvent({
    eventId: `evt-${Date.now()}`,
    attendanceId: record.attendanceId,
    workerId: record.workerId,
    eventType: 'CHECK_OUT',
    eventSource: 'WORKER_APP',
    actorId: req.user!.uid,
    actorName: req.user!.displayName,
    method: 'GPS',
    photoId: photoRecord?.photoId,
    photoUrl,
    timestamp: now,
    deviceTimestamp: deviceTimestamp || now,
    serverTimestamp: now,
    latitude: latitude || 0,
    longitude: longitude || 0,
    accuracyMeters: accuracy || 0,
    detectedAddress: resolvedAddress,
    geofenceDistanceMeters: checkOutDistance,
    location: {
      latitude: latitude || 0,
      longitude: longitude || 0,
      accuracy: accuracy || 0,
      distanceMeters: checkOutDistance,
      detectedAddress: resolvedAddress,
    },
    previousValues,
    newValues: updated || undefined,
  });

  res.json({
    attendance: updated,
    photo: photoRecord,
    workingMinutes,
    message: `Check-out successful. Total session: ${Math.floor(workingMinutes / 60)}h ${workingMinutes % 60}m.`,
  });
});

// POST /api/attendance/exception (Worker submits exception for review)
router.post('/exception', authMiddleware, (req: Request, res: Response) => {
  const { assignmentId, latitude, longitude, accuracy, photo, reason, detectedAddress } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'Exception reason is required' });
  }

  let worker = null;
  if (req.user?.role === 'WORKER') {
    worker = db.getWorkerByUserId(req.user.uid) || (req.user.workerId ? db.getWorkerById(req.user.workerId) : null);
  } else if (req.body.workerId) {
    worker = db.getWorkerById(req.body.workerId);
  }

  if (!worker) {
    return res.status(400).json({ error: 'No associated worker found' });
  }

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  let assignment = assignmentId ? db.getAssignmentById(assignmentId) : null;
  if (!assignment) {
    assignment = db.getAssignments().find(a => a.date === today && a.workerIds.includes(worker.workerId)) || null;
  }

  const address = detectedAddress || (latitude ? resolveReadableAddress(Number(latitude), Number(longitude), db.getLocations()) : 'GPS Location Exception');

  let photoUrl: string | undefined;
  let photoRecord: AttendancePhoto | undefined;
  if (photo) {
    photoUrl = saveBase64Image(photo, 'attendance_photos', `exception_${worker.workerId}`);
    const photoId = `photo-att-${Date.now()}`;
    photoRecord = {
      photoId,
      workerId: worker.workerId,
      workerName: worker.name,
      assignmentId: assignment?.assignmentId,
      assignmentTitle: assignment?.title,
      teamId: worker.primaryTeamId,
      photoType: 'CHECK_IN',
      storagePath: photoUrl,
      thumbnailPath: photoUrl,
      latitude: latitude ? Number(latitude) : 0,
      longitude: longitude ? Number(longitude) : 0,
      accuracyMeters: accuracy ? Number(accuracy) : 0,
      detectedAddress: address,
      deviceCapturedAt: now,
      serverUploadedAt: now,
      verificationStatus: 'EXCEPTION',
      createdAt: now,
    };
    if (photoRecord) {
      db.addAttendancePhoto(photoRecord);
    }
  }

  const attendanceId = `att-exc-${Date.now()}`;
  const record: Attendance = {
    attendanceId,
    workerId: worker.workerId,
    workerName: worker.name,
    workerCode: worker.workerId,
    teamId: worker.primaryTeamId,
    teamName: worker.primaryTeamName,
    assignmentId: assignment?.assignmentId,
    assignmentTitle: assignment?.title,
    date: today,
    checkInTime: now,
    checkInMethod: 'GPS',
    checkInLatitude: latitude ? Number(latitude) : undefined,
    checkInLongitude: longitude ? Number(longitude) : undefined,
    checkInAccuracy: accuracy ? Number(accuracy) : undefined,
    checkInAddress: address,
    checkInPhotoId: photoRecord?.photoId,
    checkInPhotoUrl: photoUrl,
    status: 'LOCATION_EXCEPTION',
    verificationStatus: 'FLAGGED',
    gpsStatus: 'EXCEPTION',
    photoStatus: photo ? 'SUBMITTED' : 'MISSING',
    exceptionReason: reason,
    exceptionStatus: 'PENDING',
    remarks: `Attendance exception: ${reason}`,
    createdAt: now,
    updatedAt: now,
  };

  db.addAttendance(record);

  db.addAttendanceEvent({
    eventId: `evt-${Date.now()}`,
    attendanceId,
    workerId: worker.workerId,
    eventType: 'EXCEPTION',
    eventSource: 'WORKER_APP',
    actorId: req.user!.uid,
    actorName: req.user!.displayName,
    method: 'GPS',
    photoId: photoRecord?.photoId,
    photoUrl,
    timestamp: now,
    deviceTimestamp: now,
    serverTimestamp: now,
    latitude: latitude ? Number(latitude) : 0,
    longitude: longitude ? Number(longitude) : 0,
    accuracyMeters: accuracy ? Number(accuracy) : 0,
    detectedAddress: address,
    location: {
      latitude: latitude ? Number(latitude) : 0,
      longitude: longitude ? Number(longitude) : 0,
      accuracy: accuracy ? Number(accuracy) : 0,
      detectedAddress: address,
    },
    reason,
    newValues: record,
  });

  const team = worker.primaryTeamId ? db.getTeamById(worker.primaryTeamId) : null;
  const recipientId = team?.leaderIds[0] || 'admin';
  db.addNotification({
    notificationId: `notif-${Date.now()}`,
    recipientId,
    title: 'Attendance Exception Request',
    message: `${worker.name} submitted an attendance exception for ${today}: "${reason}"`,
    type: 'ATTENDANCE',
    read: false,
    relatedEntityId: attendanceId,
    createdAt: now,
  });

  res.status(201).json({
    attendance: record,
    message: 'Attendance exception submitted for Team Leader review',
  });
});

// GET /api/attendance/photos (List attendance photos)
router.get('/photos', authMiddleware, (req: Request, res: Response) => {
  const { workerId, teamId, assignmentId, photoType } = req.query;
  const photos = db.getAttendancePhotos({
    workerId: workerId as string,
    teamId: teamId as string,
    assignmentId: assignmentId as string,
    photoType: photoType as string,
  });
  res.json(photos);
});

// GET /api/attendance/photos/:id
router.get('/photos/:id', authMiddleware, (req: Request, res: Response) => {
  const id = req.params.id as string;
  const photo = db.getAttendancePhotoById(id);
  if (!photo) return res.status(404).json({ error: 'Photo not found' });
  res.json(photo);
});

// POST /api/attendance/photos
router.post('/photos', authMiddleware, (req: Request, res: Response) => {
  const { photo, photoType, latitude, longitude, accuracy, assignmentId, detectedAddress } = req.body;
  if (!photo) return res.status(400).json({ error: 'Photo data is required' });

  let worker = null;
  if (req.user?.role === 'WORKER') {
    worker = db.getWorkerByUserId(req.user.uid) || (req.user.workerId ? db.getWorkerById(req.user.workerId) : null);
  } else if (req.body.workerId) {
    worker = db.getWorkerById(req.body.workerId);
  }

  const workerId = worker ? worker.workerId : (req.user?.workerId || 'unknown');
  const workerName = worker ? worker.name : req.user?.displayName;
  const now = new Date().toISOString();

  const photoUrl = saveBase64Image(photo, 'attendance_photos', `att_${workerId}`);
  const photoId = `photo-att-${Date.now()}`;

  const photoRecord: AttendancePhoto = {
    photoId,
    workerId,
    workerName,
    assignmentId,
    teamId: worker?.primaryTeamId,
    photoType: photoType || 'CHECK_IN',
    storagePath: photoUrl,
    thumbnailPath: photoUrl,
    latitude: latitude ? Number(latitude) : 0,
    longitude: longitude ? Number(longitude) : 0,
    accuracyMeters: accuracy ? Number(accuracy) : 10,
    detectedAddress: detectedAddress || (latitude ? resolveReadableAddress(Number(latitude), Number(longitude), db.getLocations()) : ''),
    deviceCapturedAt: now,
    serverUploadedAt: now,
    verificationStatus: 'VERIFIED',
    createdAt: now,
  };

  db.addAttendancePhoto(photoRecord);
  res.status(201).json(photoRecord);
});

// GET /api/attendance/:id (Detailed attendance profile)
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  const id = req.params.id as string;
  const record = db.getAttendanceById(id);
  if (!record) return res.status(404).json({ error: 'Attendance record not found' });

  const events = db.getAttendanceEvents(id);
  const checkInPhoto = record.checkInPhotoId ? db.getAttendancePhotoById(record.checkInPhotoId) : null;
  const checkOutPhoto = record.checkOutPhotoId ? db.getAttendancePhotoById(record.checkOutPhotoId) : null;
  const worker = db.getWorkerById(record.workerId);
  const assignment = record.assignmentId ? db.getAssignmentById(record.assignmentId) : null;

  res.json({
    ...record,
    worker,
    assignment,
    checkInPhoto,
    checkOutPhoto,
    events,
  });
});

// POST /api/attendance/manual (Team leader or admin manual attendance)
router.post('/manual', authMiddleware, requireRole(['ADMIN', 'TEAM_LEADER']), (req: Request, res: Response) => {
  const { workerId, assignmentId, date, status, reason } = req.body;

  if (!workerId || !status || !reason) {
    return res.status(400).json({ error: 'Worker ID, attendance status, and reason are required for manual attendance' });
  }

  const worker = db.getWorkerById(workerId);
  if (!worker) return res.status(404).json({ error: 'Worker not found' });

  // If leader, check that worker belongs to their managed team
  if (req.user?.role === 'TEAM_LEADER' && req.user.managedTeamIds) {
    if (worker.primaryTeamId && !req.user.managedTeamIds.includes(worker.primaryTeamId)) {
      return res.status(403).json({ error: 'Cannot mark attendance for workers outside your managed teams' });
    }
  }

  const targetDate = date || new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  // Find if record already exists for this date
  const existing = db.getAttendance().find(a => a.workerId === workerId && a.date === targetDate);
  const method: AttendanceMethod = req.user?.role === 'ADMIN' ? 'MANUAL_ADMIN' : 'MANUAL_LEADER';

  let savedRecord: Attendance;
  if (existing) {
    const prev = { ...existing };
    savedRecord = db.updateAttendance(existing.attendanceId, {
      status: status as AttendanceStatus,
      checkInMethod: method,
      verificationStatus: 'MANUAL_OVERRIDE',
      markedBy: req.user!.uid,
      markedByName: req.user!.displayName,
      remarks: `Manual mark by ${req.user!.displayName}: ${reason}`,
    })!;

    db.addAttendanceEvent({
      eventId: `evt-${Date.now()}`,
      attendanceId: existing.attendanceId,
      workerId,
      eventType: 'MANUAL_MARK',
      eventSource: req.user?.role === 'ADMIN' ? 'ADMIN_PORTAL' : 'LEADER_PORTAL',
      actorId: req.user!.uid,
      actorName: req.user!.displayName,
      timestamp: now,
      reason,
      previousValues: prev,
      newValues: savedRecord,
    });
  } else {
    const attendanceId = `att-man-${Date.now()}`;
    savedRecord = {
      attendanceId,
      workerId: worker.workerId,
      workerName: worker.name,
      workerCode: worker.workerId,
      teamId: worker.primaryTeamId,
      teamName: worker.primaryTeamName,
      assignmentId,
      date: targetDate,
      checkInTime: status === 'PRESENT' ? `${targetDate}T08:00:00Z` : undefined,
      checkInMethod: method,
      status: status as AttendanceStatus,
      workingMinutes: status === 'PRESENT' ? 480 : status === 'HALF_DAY' ? 240 : 0,
      verificationStatus: 'MANUAL_OVERRIDE',
      markedBy: req.user!.uid,
      markedByName: req.user!.displayName,
      remarks: `Manual mark by ${req.user!.displayName}: ${reason}`,
      createdAt: now,
      updatedAt: now,
    };
    db.addAttendance(savedRecord);

    db.addAttendanceEvent({
      eventId: `evt-${Date.now()}`,
      attendanceId,
      workerId,
      eventType: 'MANUAL_MARK',
      eventSource: req.user?.role === 'ADMIN' ? 'ADMIN_PORTAL' : 'LEADER_PORTAL',
      actorId: req.user!.uid,
      actorName: req.user!.displayName,
      timestamp: now,
      reason,
      newValues: savedRecord,
    });
  }

  res.status(201).json(savedRecord);
});

// POST /api/attendance/:id/correction-request (Worker requests correction)
router.post('/:id/correction-request', authMiddleware, (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { reason } = req.body;

  if (!reason) return res.status(400).json({ error: 'Reason is required for attendance correction request' });

  const record = db.getAttendanceById(id);
  if (!record) return res.status(404).json({ error: 'Attendance record not found' });

  const updated = db.updateAttendance(record.attendanceId, {
    correctionRequested: true,
    correctionReason: reason,
  });

  // Notify team leader or admin
  const team = record.teamId ? db.getTeamById(record.teamId) : null;
  const recipientId = (team && team.leaderIds[0]) ? team.leaderIds[0] : 'admin';

  db.addNotification({
    notificationId: `notif-${Date.now()}`,
    recipientId,
    title: 'Attendance Correction Requested',
    message: `${record.workerName} requested attendance correction for ${record.date}: "${reason}"`,
    type: 'CORRECTION',
    read: false,
    relatedEntityId: record.attendanceId,
    createdAt: new Date().toISOString(),
  });

  res.json({ success: true, attendance: updated });
});

// POST /api/attendance/:id/corrections (Leader or Admin approves or applies correction)
router.post('/:id/corrections', authMiddleware, requireRole(['ADMIN', 'TEAM_LEADER']), (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status, remarks, workingMinutes, approved } = req.body;

  const record = db.getAttendanceById(id);
  if (!record) return res.status(404).json({ error: 'Attendance record not found' });

  const prev = { ...record };
  const updates: Partial<Attendance> = {
    correctionRequested: false,
    remarks: remarks || record.remarks,
  };

  if (approved === false) {
    updates.remarks = `Correction rejected by ${req.user!.displayName}: ${remarks || 'Request not justified'}`;
  } else {
    if (status) updates.status = status;
    if (workingMinutes !== undefined) updates.workingMinutes = Number(workingMinutes);
    updates.verificationStatus = 'MANUAL_OVERRIDE';
  }

  const updated = db.updateAttendance(record.attendanceId, updates);

  db.addAttendanceEvent({
    eventId: `evt-${Date.now()}`,
    attendanceId: record.attendanceId,
    workerId: record.workerId,
    eventType: 'CORRECTION',
    eventSource: req.user?.role === 'ADMIN' ? 'ADMIN_PORTAL' : 'LEADER_PORTAL',
    actorId: req.user!.uid,
    actorName: req.user!.displayName,
    timestamp: new Date().toISOString(),
    reason: remarks || (approved ? 'Correction approved' : 'Correction rejected'),
    previousValues: prev,
    newValues: updated || undefined,
  });

  // Notify worker
  db.addNotification({
    notificationId: `notif-${Date.now()}`,
    recipientId: record.workerId,
    title: 'Correction Request Update',
    message: approved
      ? `Your attendance for ${record.date} was updated to ${status}.`
      : `Your attendance correction request for ${record.date} was not approved.`,
    type: 'ATTENDANCE',
    read: false,
    relatedEntityId: record.attendanceId,
    createdAt: new Date().toISOString(),
  });

  res.json(updated);
});

export default router;
