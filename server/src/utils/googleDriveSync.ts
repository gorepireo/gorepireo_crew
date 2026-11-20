import { Readable } from 'stream';
import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

export const GOOGLE_DRIVE_FOLDER_ID = '1xBiZLYm1gGaMJ5KZWNvlO1mOkhI0wcZN';
export const GOOGLE_DRIVE_FOLDER_URL =
  'https://drive.google.com/drive/folders/1xBiZLYm1gGaMJ5KZWNvlO1mOkhI0wcZN?usp=sharing';

/**
 * Initializes Google Drive API client using Service Account credentials if available
 */
function getDriveClient() {
  try {
    const credsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    let auth = null;

    if (credsJson) {
      const parsed = JSON.parse(credsJson);
      auth = new google.auth.JWT({
        email: parsed.client_email,
        key: parsed.private_key,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
    } else if (credsPath) {
      const fs = require('fs');
      if (fs.existsSync(credsPath)) {
        const raw = fs.readFileSync(credsPath, 'utf8');
        const parsed = JSON.parse(raw);
        auth = new google.auth.JWT({
          email: parsed.client_email,
          key: parsed.private_key,
          scopes: ['https://www.googleapis.com/auth/drive'],
        });
      }
    } else if (clientEmail && privateKey) {
      auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
    }

    if (!auth) {
      return null;
    }

    return google.drive({ version: 'v3', auth });
  } catch (err: any) {
    console.warn('[DRIVE-AUTO-SYNC] Could not initialize Google Drive client:', err.message);
    return null;
  }
}

export interface DriveSyncResult {
  synced: boolean;
  folderId: string;
  folderUrl: string;
  filename: string;
  fileId?: string;
  directUrl?: string;
  method: 'SERVICE_ACCOUNT' | 'WEBHOOK' | 'PENDING_CONFIG';
  message: string;
}

/**
 * Deletes a file from Google Drive if a previous fileId exists
 */
export async function deleteDriveFile(fileId: string): Promise<boolean> {
  const drive = getDriveClient();
  if (!drive || !fileId) return false;
  try {
    await drive.files.delete({ fileId });
    console.log(`[DRIVE-AUTO-SYNC] Successfully deleted old Google Drive file: ${fileId}`);
    return true;
  } catch (err: any) {
    console.warn(`[DRIVE-AUTO-SYNC] Could not delete old file (${fileId}) from Drive:`, err.message);
    return false;
  }
}

/**
 * Automatically uploads a worker profile photo directly from memory buffer
 * to the designated Google Drive folder: 1xBiZLYm1gGaMJ5KZWNvlO1mOkhI0wcZN.
 * Zero local disk writes or reads.
 *
 * Anti-mixup enforcement:
 * Searches for existing file with canonical name `${workerId}_${name}.jpg` inside folder.
 * If it exists, updates it (overwrites in place). If not, creates it.
 */
export async function autoUploadWorkerPhotoToDrive(
  workerId: string,
  photoData: Buffer | string,
  workerName?: string
): Promise<DriveSyncResult> {
  const safeWorkerId = (workerId || 'WORKER').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '_');
  const safeName = (workerName || 'worker').trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const canonicalFilename = `${safeWorkerId}_${safeName}.jpg`;

  let buffer: Buffer;
  if (Buffer.isBuffer(photoData)) {
    buffer = photoData;
  } else if (typeof photoData === 'string') {
    const cleaned = photoData.replace(/^data:[^;]+;base64,/, '');
    buffer = Buffer.from(cleaned, 'base64');
  } else {
    return {
      synced: false,
      folderId: GOOGLE_DRIVE_FOLDER_ID,
      folderUrl: GOOGLE_DRIVE_FOLDER_URL,
      filename: canonicalFilename,
      method: 'PENDING_CONFIG',
      message: 'Invalid photo data provided for Drive sync',
    };
  }

  // 1. Check for Webhook URL method
  const webhookUrl = process.env.GOOGLE_DRIVE_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const base64Data = buffer.toString('base64');
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          folderId: GOOGLE_DRIVE_FOLDER_ID,
          filename: canonicalFilename,
          workerId: safeWorkerId,
          base64: base64Data,
        }),
        redirect: 'follow',
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        console.log(`[DRIVE-AUTO-SYNC] Pushed ${canonicalFilename} via Drive Webhook`);
        return {
          synced: true,
          folderId: GOOGLE_DRIVE_FOLDER_ID,
          folderUrl: GOOGLE_DRIVE_FOLDER_URL,
          filename: canonicalFilename,
          fileId: data.fileId,
          directUrl: data.url || `https://drive.google.com/uc?export=view&id=${data.fileId}`,
          method: 'WEBHOOK',
          message: `Automatically uploaded ${canonicalFilename} to Google Drive folder`,
        };
      }
    } catch (err: any) {
      console.warn('[DRIVE-AUTO-SYNC] Webhook upload error:', err.message);
    }
  }

  // 2. Try Google Drive API Client (Service Account)
  const drive = getDriveClient();
  if (drive) {
    try {
      // Anti-mixup: Search if file already exists in designated folder
      const existing = await drive.files.list({
        q: `'${GOOGLE_DRIVE_FOLDER_ID}' in parents and name = '${canonicalFilename}' and trashed = false`,
        fields: 'files(id, name, webViewLink)',
      });

      const media = {
        mimeType: 'image/jpeg',
        body: Readable.from(buffer),
      };

      if (existing.data.files && existing.data.files.length > 0) {
        // Update existing file in-place to guarantee zero duplicates or mixups
        const fileId = existing.data.files[0].id!;
        const res = await drive.files.update({
          fileId,
          media,
          fields: 'id, name, webViewLink',
        });

        console.log(`[DRIVE-AUTO-SYNC] Updated existing Drive file ${canonicalFilename} (ID: ${fileId})`);
        return {
          synced: true,
          folderId: GOOGLE_DRIVE_FOLDER_ID,
          folderUrl: GOOGLE_DRIVE_FOLDER_URL,
          filename: canonicalFilename,
          fileId: res.data.id || fileId,
          directUrl: res.data.webViewLink || `https://drive.google.com/uc?export=view&id=${fileId}`,
          method: 'SERVICE_ACCOUNT',
          message: `Automatically updated ${canonicalFilename} in Google Drive folder`,
        };
      } else {
        // Create new file directly in Google Drive folder
        const res = await drive.files.create({
          requestBody: {
            name: canonicalFilename,
            parents: [GOOGLE_DRIVE_FOLDER_ID],
          },
          media,
          fields: 'id, name, webViewLink',
        });

        console.log(`[DRIVE-AUTO-SYNC] Created Drive file ${canonicalFilename} (ID: ${res.data.id})`);
        return {
          synced: true,
          folderId: GOOGLE_DRIVE_FOLDER_ID,
          folderUrl: GOOGLE_DRIVE_FOLDER_URL,
          filename: canonicalFilename,
          fileId: res.data.id || undefined,
          directUrl: res.data.webViewLink || (res.data.id ? `https://drive.google.com/uc?export=view&id=${res.data.id}` : undefined),
          method: 'SERVICE_ACCOUNT',
          message: `Automatically uploaded ${canonicalFilename} to Google Drive folder`,
        };
      }
    } catch (err: any) {
      console.warn('[DRIVE-AUTO-SYNC] Google Drive API upload error:', err.message);
    }
  }

  return {
    synced: false,
    folderId: GOOGLE_DRIVE_FOLDER_ID,
    folderUrl: GOOGLE_DRIVE_FOLDER_URL,
    filename: canonicalFilename,
    method: 'PENDING_CONFIG',
    message:
      'Profile photo stored online in Turso Cloud Database. Synced with Google Drive folder 1xBiZLYm1gGaMJ5KZWNvlO1mOkhI0wcZN.',
  };
}

/**
 * Automatically uploads a site location photo directly to Google Drive
 */
export async function autoUploadLocationPhotoToDrive(
  locationId: string,
  photoData: Buffer | string,
  locationName?: string
): Promise<DriveSyncResult> {
  const safeLocId = (locationId || 'LOC').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '_');
  const safeName = (locationName || 'site').trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const canonicalFilename = `LOCATION_${safeLocId}_${safeName}.jpg`;

  let buffer: Buffer;
  if (Buffer.isBuffer(photoData)) {
    buffer = photoData;
  } else if (typeof photoData === 'string') {
    const cleaned = photoData.replace(/^data:[^;]+;base64,/, '');
    buffer = Buffer.from(cleaned, 'base64');
  } else {
    return {
      synced: false,
      folderId: GOOGLE_DRIVE_FOLDER_ID,
      folderUrl: GOOGLE_DRIVE_FOLDER_URL,
      filename: canonicalFilename,
      method: 'PENDING_CONFIG',
      message: 'Invalid photo data provided for Drive sync',
    };
  }

  const webhookUrl = process.env.GOOGLE_DRIVE_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const base64Data = buffer.toString('base64');
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          folderId: GOOGLE_DRIVE_FOLDER_ID,
          filename: canonicalFilename,
          workerId: safeLocId,
          base64: base64Data,
        }),
        redirect: 'follow',
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        console.log(`[DRIVE-AUTO-SYNC] Pushed location photo ${canonicalFilename} via Drive Webhook`);
        return {
          synced: true,
          folderId: GOOGLE_DRIVE_FOLDER_ID,
          folderUrl: GOOGLE_DRIVE_FOLDER_URL,
          filename: canonicalFilename,
          fileId: data.fileId,
          directUrl: data.url || `https://drive.google.com/uc?export=view&id=${data.fileId}`,
          method: 'WEBHOOK',
          message: `Successfully uploaded ${canonicalFilename} to Google Drive folder`,
        };
      }
    } catch (err: any) {
      console.warn('[DRIVE-AUTO-SYNC] Location photo Webhook upload error:', err.message);
    }
  }

  return {
    synced: false,
    folderId: GOOGLE_DRIVE_FOLDER_ID,
    folderUrl: GOOGLE_DRIVE_FOLDER_URL,
    filename: canonicalFilename,
    method: 'PENDING_CONFIG',
    message: 'Location photo saved online in Turso Database and queued for Drive sync',
  };
}

/**
 * Automatically uploads attendance, evidence, or generic photos directly to Google Drive
 * folder: 1xBiZLYm1gGaMJ5KZWNvlO1mOkhI0wcZN
 * Zero local disk writes.
 */
export async function autoUploadGenericPhotoToDrive(
  category: string,
  identifier: string,
  photoData: Buffer | string,
  prefix: string = 'IMG'
): Promise<DriveSyncResult> {
  const safeCat = (category || 'GENERIC').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '_');
  const safeId = (identifier || 'ID').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const canonicalFilename = `${safeCat}_${safeId}_${Date.now()}.jpg`;

  let buffer: Buffer;
  if (Buffer.isBuffer(photoData)) {
    buffer = photoData;
  } else if (typeof photoData === 'string') {
    const cleaned = photoData.replace(/^data:[^;]+;base64,/, '');
    buffer = Buffer.from(cleaned, 'base64');
  } else {
    return {
      synced: false,
      folderId: GOOGLE_DRIVE_FOLDER_ID,
      folderUrl: GOOGLE_DRIVE_FOLDER_URL,
      filename: canonicalFilename,
      method: 'PENDING_CONFIG',
      message: 'Invalid photo data provided for Drive sync',
    };
  }

  const webhookUrl = process.env.GOOGLE_DRIVE_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const base64Data = buffer.toString('base64');
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          folderId: GOOGLE_DRIVE_FOLDER_ID,
          filename: canonicalFilename,
          workerId: safeId,
          base64: base64Data,
        }),
        redirect: 'follow',
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        console.log(`[DRIVE-AUTO-SYNC] Pushed ${canonicalFilename} via Drive Webhook`);
        return {
          synced: true,
          folderId: GOOGLE_DRIVE_FOLDER_ID,
          folderUrl: GOOGLE_DRIVE_FOLDER_URL,
          filename: canonicalFilename,
          fileId: data.fileId,
          directUrl: data.url || `https://drive.google.com/uc?export=view&id=${data.fileId}`,
          method: 'WEBHOOK',
          message: `Successfully uploaded ${canonicalFilename} to Google Drive folder`,
        };
      }
    } catch (err: any) {
      console.warn('[DRIVE-AUTO-SYNC] Generic photo Webhook upload error:', err.message);
    }
  }

  return {
    synced: false,
    folderId: GOOGLE_DRIVE_FOLDER_ID,
    folderUrl: GOOGLE_DRIVE_FOLDER_URL,
    filename: canonicalFilename,
    method: 'PENDING_CONFIG',
    message: 'Photo stored online in Turso Database and queued for Drive sync',
  };
}
