import fs from 'fs';
import path from 'path';
import { autoUploadGenericPhotoToDrive } from './googleDriveSync';

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');
const ATTENDANCE_DIR = path.join(UPLOAD_ROOT, 'attendance_photos');
const EVIDENCE_DIR = path.join(UPLOAD_ROOT, 'work_evidence');
const WORKERS_DIR = path.join(UPLOAD_ROOT, 'workers');
const PROFILES_DIR = path.join(UPLOAD_ROOT, 'profiles');

// Target Google Drive Folder designated for Worker Profile Photos
export const GOOGLE_DRIVE_WORKERS_FOLDER = {
  id: '1xBiZLYm1gGaMJ5KZWNvlO1mOkhI0wcZN',
  url: 'https://drive.google.com/drive/folders/1xBiZLYm1gGaMJ5KZWNvlO1mOkhI0wcZN?usp=sharing',
  name: 'WorkCrew Worker Profile Photos',
  description: 'Designated Google Drive repository for unique worker profile pictures',
};

export function ensureUploadDirs() {
  // No local upload directories needed in 100% cloud & drive mode
}

/**
 * Deletes a previously uploaded file from local disk if it was stored locally.
 * Ensures path-traversal safety inside UPLOAD_ROOT.
 */
export function deleteUploadedFile(fileUrl?: string): boolean {
  if (!fileUrl) return false;
  try {
    const cleanUrl = fileUrl.split('?')[0]; // Strip cache buster ?v=...
    if (cleanUrl.startsWith('/uploads/')) {
      const relPath = cleanUrl.replace(/^\/uploads\//, '');
      const fullPath = path.join(UPLOAD_ROOT, relPath);
      if (fullPath.startsWith(UPLOAD_ROOT) && fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`[STORAGE] Deleted old profile image from local disk: ${fullPath}`);
        return true;
      }
    }
  } catch (err: any) {
    console.warn(`[STORAGE] Could not delete previous file (${fileUrl}):`, err.message);
  }
  return false;
}

/**
 * Saves a profile photo 100% ONLINE (Turso Cloud Database + Google Drive in-memory).
 * ZERO local disk writes.
 * If a previous file existed on local disk, it is deleted and removed.
 */
export function saveProfilePhoto(
  base64Data: string,
  accountType: string,
  identifier: string,
  previousPhotoUrl?: string,
  accountName?: string
): {
  publicUrl: string;
  buffer: Buffer;
  deletedPrevious: boolean;
} {
  // 1. Delete previous profile image file from local disk if any was leftover
  const deletedPrevious = deleteUploadedFile(previousPhotoUrl);

  // 2. Format / normalize base64 data URL
  let cleanBase64 = base64Data;
  let mimeType = 'image/jpeg';

  if (base64Data.startsWith('data:')) {
    const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      cleanBase64 = match[2];
    } else {
      cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    }
  }

  const buffer = Buffer.from(cleanBase64, 'base64');

  // 3. Online Cloud Data URI format (stored directly in Turso Cloud Database)
  // This guarantees 0 local disk dependency and full availability on any device online
  const onlineCloudUrl = `data:${mimeType};base64,${cleanBase64}`;

  return {
    publicUrl: onlineCloudUrl,
    buffer,
    deletedPrevious,
  };
}

/**
 * Saves a worker profile photo 100% ONLINE with strict anti-mixup worker identity.
 * Stored in Turso Cloud Database and synced directly to Google Drive folder 1xBiZLYm1gGaMJ5KZWNvlO1mOkhI0wcZN.
 * Zero local disk writes.
 */
export function saveWorkerProfilePhoto(
  base64Data: string,
  workerId: string,
  workerName?: string,
  previousPhotoUrl?: string
): {
  publicUrl: string;
  buffer: Buffer;
  workerId: string;
  googleDriveFolderId: string;
  googleDriveFolderUrl: string;
  driveCanonicalFilename: string;
} {
  // If previous photo URL was on local disk, remove it
  if (previousPhotoUrl && previousPhotoUrl.startsWith('/uploads/')) {
    deleteUploadedFile(previousPhotoUrl);
  }

  const safeWorkerId = (workerId || 'WORKER').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '_');
  const safeName = (workerName || 'worker').trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const driveCanonicalFilename = `${safeWorkerId}_${safeName}.jpg`;

  let cleanBase64 = base64Data;
  let mimeType = 'image/jpeg';

  if (base64Data.startsWith('data:')) {
    const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      cleanBase64 = match[2];
    } else {
      cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    }
  }

  const buffer = Buffer.from(cleanBase64, 'base64');
  const onlineCloudUrl = `data:${mimeType};base64,${cleanBase64}`;

  return {
    publicUrl: onlineCloudUrl,
    buffer,
    workerId: safeWorkerId,
    googleDriveFolderId: GOOGLE_DRIVE_WORKERS_FOLDER.id,
    googleDriveFolderUrl: GOOGLE_DRIVE_WORKERS_FOLDER.url,
    driveCanonicalFilename,
  };
}

/**
 * Saves a base64 encoded image string 100% ONLINE (Turso Database + Google Drive folder).
 * ZERO local disk writes.
 */
export function saveBase64Image(
  base64Data: string,
  subfolder: 'attendance_photos' | 'work_evidence',
  prefix: string = 'img'
): string {
  // If it's already an HTTP URL or Data URI, return as-is
  if (base64Data.startsWith('http://') || base64Data.startsWith('https://')) {
    return base64Data;
  }

  let cleanBase64 = base64Data;
  let mimeType = 'image/jpeg';

  if (base64Data.startsWith('data:')) {
    const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      cleanBase64 = match[2];
    } else {
      cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    }
  }

  const onlineCloudUrl = `data:${mimeType};base64,${cleanBase64}`;

  // Asynchronously sync to Google Drive folder: 1xBiZLYm1gGaMJ5KZWNvlO1mOkhI0wcZN
  const category = subfolder === 'attendance_photos' ? 'ATTENDANCE' : 'EVIDENCE';
  autoUploadGenericPhotoToDrive(category, prefix, cleanBase64)
    .then((res) => console.log(`[DRIVE-SYNC] ${category} photo uploaded to Drive:`, res.filename))
    .catch((err) => console.warn(`[DRIVE-SYNC] Drive background upload notice:`, err.message));

  return onlineCloudUrl;
}
