import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';
import { WorkLocation } from '../types';
import { calculateHaversineDistance } from '../utils/geo';
import { resolveReadableAddress } from '../utils/reverseGeo';
import { autoUploadLocationPhotoToDrive } from '../utils/googleDriveSync';

const router = Router();

// GET /api/locations
router.get('/', authMiddleware, (req: Request, res: Response) => {
  const locations = db.getLocations();
  const assignments = db.getAssignments();

  // Enrich with active assignments count
  const enriched = locations.map(loc => {
    const activeAssignments = assignments.filter(
      a => a.locationId === loc.locationId && a.status !== 'COMPLETED' && a.status !== 'CANCELLED'
    );
    return {
      ...loc,
      activeAssignmentsCount: activeAssignments.length,
    };
  });

  res.json(enriched);
});

// POST /api/locations
router.post('/', authMiddleware, requireRole(['ADMIN', 'TEAM_LEADER']), async (req: Request, res: Response) => {
  const { name, address, latitude, longitude, geofenceRadiusMeters, photo, photoURL } = req.body;

  if (!name || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Location name, latitude, and longitude are required' });
  }

  const existing = db.getLocations();
  const maxNum = existing.reduce((max, l) => {
    const m = l.locationId.match(/^LOC-(\d+)$/);
    return m ? Math.max(max, Number(m[1])) : max;
  }, 0);
  const nextNum = (maxNum + 1).toString().padStart(3, '0');
  const locationId = `LOC-${nextNum}`;
  const now = new Date().toISOString();

  const defaultRadius = db.getSettings().defaultGeofenceRadiusMeters || 100;

  const newLocation: WorkLocation = {
    locationId,
    name: name.trim(),
    address: address || '',
    latitude: Number(latitude),
    longitude: Number(longitude),
    geofenceRadiusMeters: Number(geofenceRadiusMeters) || defaultRadius,
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };

  const photoInput = photo || photoURL;
  if (photoInput) {
    newLocation.photoURL = photoInput;
    try {
      const driveRes = await autoUploadLocationPhotoToDrive(locationId, photoInput, name);
      if (driveRes.fileId) {
        newLocation.googleDriveFileId = driveRes.fileId;
      }
    } catch (e: any) {
      console.warn('[LOCATIONS] Could not upload location photo to Drive:', e.message);
    }
  }

  db.addLocation(newLocation);
  try {
    await db.persistLocationToTurso(newLocation);
  } catch (err: any) {
    console.error('[LOCATIONS] Failed to persist location to Turso:', err?.message);
    return res.status(500).json({ error: 'Failed to save work location to database' });
  }

  db.logActivity({
    logId: `log-${Date.now()}`,
    actorId: req.user!.uid,
    actorName: req.user!.displayName,
    actorRole: req.user!.role,
    action: 'CREATED_LOCATION',
    entityType: 'LOCATION',
    entityId: locationId,
    changes: { name, latitude, longitude, radius: newLocation.geofenceRadiusMeters, hasPhoto: Boolean(newLocation.photoURL) },
    timestamp: now,
  });

  res.status(201).json(newLocation);
});

// PATCH /api/locations/:id
router.patch('/:id', authMiddleware, requireRole(['ADMIN', 'TEAM_LEADER']), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const loc = db.getLocationById(id);
  if (!loc) return res.status(404).json({ error: 'Location not found' });

  const { name, address, latitude, longitude, geofenceRadiusMeters, status, photo, photoURL } = req.body;
  const updates: Partial<WorkLocation> = {};

  if (name) updates.name = name.trim();
  if (address !== undefined) updates.address = address;
  if (latitude !== undefined) updates.latitude = Number(latitude);
  if (longitude !== undefined) updates.longitude = Number(longitude);
  if (geofenceRadiusMeters !== undefined) updates.geofenceRadiusMeters = Number(geofenceRadiusMeters);
  if (status) updates.status = status;

  const photoInput = photo || photoURL;
  if (photoInput) {
    updates.photoURL = photoInput;
    try {
      const driveRes = await autoUploadLocationPhotoToDrive(loc.locationId, photoInput, name || loc.name);
      if (driveRes.fileId) {
        updates.googleDriveFileId = driveRes.fileId;
      }
    } catch (e: any) {
      console.warn('[LOCATIONS] Could not upload updated location photo to Drive:', e.message);
    }
  }

  const updated = db.updateLocation(loc.locationId, updates);
  if (updated) {
    try {
      await db.persistLocationToTurso(updated);
    } catch (err: any) {
      console.error('[LOCATIONS] Failed to update location in Turso:', err?.message);
      return res.status(500).json({ error: 'Failed to update work location in database' });
    }
  }
  res.json(updated);
});

// GET /api/locations/:id
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  const id = req.params.id as string;
  const loc = db.getLocationById(id);
  if (!loc) return res.status(404).json({ error: 'Location not found' });
  res.json(loc);
});

// POST /api/locations/verify (or /api/location/verify)
router.post('/verify', authMiddleware, (req: Request, res: Response) => {
  const { latitude, longitude, accuracy, locationId, assignmentId } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Latitude and longitude are required for verification' });
  }

  const lat = Number(latitude);
  const lon = Number(longitude);
  const acc = accuracy !== undefined ? Number(accuracy) : 10;

  let targetLoc: WorkLocation | null = null;

  if (locationId) {
    targetLoc = db.getLocationById(locationId) || null;
  } else if (assignmentId) {
    const asn = db.getAssignmentById(assignmentId);
    if (asn?.locationId) {
      targetLoc = db.getLocationById(asn.locationId) || null;
    }
  }

  if (!targetLoc) {
    // Pick first active location or find nearest
    targetLoc = db.getLocations()[0] || null;
  }

  const settings = db.getSettings();
  const radius = targetLoc?.geofenceRadiusMeters || settings.defaultGeofenceRadiusMeters || 100;
  const maxAllowedAcc = settings.maxAllowedGPSAccuracyMeters || 50;

  const targetLat = targetLoc ? targetLoc.latitude : lat;
  const targetLon = targetLoc ? targetLoc.longitude : lon;

  const dist = calculateHaversineDistance(lat, lon, targetLat, targetLon);
  const isWithinGeofence = dist <= (radius + Math.min(acc, 20));
  const accuracyAcceptable = acc <= maxAllowedAcc;
  const detectedAddress = resolveReadableAddress(lat, lon, db.getLocations());

  let status: 'VERIFIED' | 'OUTSIDE_GEOFENCE' | 'POOR_ACCURACY' = 'VERIFIED';
  let message = `GPS Verified on site (${dist}m from perimeter, accuracy ±${acc}m)`;

  if (!accuracyAcceptable) {
    status = 'POOR_ACCURACY';
    message = `GPS signal accuracy (±${acc}m) exceeds the allowable threshold (±${maxAllowedAcc}m). Please move to an open area and retry.`;
  } else if (!isWithinGeofence) {
    status = 'OUTSIDE_GEOFENCE';
    message = `Outside verified geofence (${dist}m from worksite, allowed radius is ${radius}m).`;
  }

  res.json({
    status,
    isWithinGeofence,
    accuracyAcceptable,
    distanceMeters: dist,
    geofenceRadiusMeters: radius,
    accuracyMeters: acc,
    detectedAddress,
    targetLocation: targetLoc,
    message,
  });
});

export default router;
