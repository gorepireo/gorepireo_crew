import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { db } from '../db';
import {
  identifyPeopleInPhoto,
  getIndexedFacialProfiles,
  indexPersonFace,
} from '../utils/facialRecognition';

const router = Router();

// Automatically index all existing workers and leaders with photos on server initialization
export function initializeFacialRecognitionIndex() {
  try {
    const workers = db.getWorkers();
    let count = 0;
    for (const w of workers) {
      if (w.photoURL && w.photoURL.startsWith('data:')) {
        indexPersonFace(w.workerId, w.name, 'WORKER', w.photoURL, w.photoURL);
        count++;
      }
    }

    const leaders = db.getTeamLeaders();
    for (const l of leaders) {
      if (l.photoURL && l.photoURL.startsWith('data:')) {
        indexPersonFace(l.leaderId, l.name, 'TEAM_LEADER', l.photoURL, l.photoURL);
        count++;
      }
    }
    console.log(`[FACIAL-RECOGNITION] Initialized biometric index with ${count} registered profiles`);
  } catch (err: any) {
    console.warn('[FACIAL-RECOGNITION] Index initialization note:', err.message);
  }
}

/**
 * POST /api/recognition/identify
 * Scans a group photo or evidence image and identifies all individuals present.
 */
router.post('/identify', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { photo, threshold } = req.body;
    if (!photo) {
      return res.status(400).json({ error: 'Photo data (base64 image or data URL) is required' });
    }

    const minConfidence = threshold ? Number(threshold) : 70.0;
    const result = identifyPeopleInPhoto(photo, minConfidence);

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err: any) {
    console.error('[FACIAL-RECOGNITION] Identification error:', err);
    return res.status(500).json({ error: err.message || 'Failed to process facial recognition' });
  }
});

/**
 * GET /api/recognition/profiles
 * Lists all registered and indexed biometric profiles.
 */
router.get('/profiles', authMiddleware, (req: Request, res: Response) => {
  const profiles = getIndexedFacialProfiles();
  return res.json({
    totalIndexed: profiles.length,
    profiles: profiles.map((p) => ({
      personId: p.personId,
      name: p.name,
      role: p.role,
      signatureHash: p.signatureHash,
      metrics: p.metrics,
      indexedAt: p.indexedAt,
    })),
  });
});

/**
 * POST /api/recognition/reindex-all
 * Triggers re-indexing of all database profile photos.
 */
router.post('/reindex-all', authMiddleware, (req: Request, res: Response) => {
  initializeFacialRecognitionIndex();
  const profiles = getIndexedFacialProfiles();
  return res.json({
    success: true,
    totalIndexed: profiles.length,
    message: `Successfully re-indexed ${profiles.length} profiles for group photo recognition`,
  });
});

export default router;
