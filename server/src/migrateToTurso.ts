import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env');
  process.exit(1);
}

const client = createClient({ url, authToken });

async function migrate() {
  console.log('Connecting to Turso and creating schema...');

  // 1. Create collections sync table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS workcrew_store (
      collection TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // 2. Create structured relational tables
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      uid TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      displayName TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      photoURL TEXT,
      organizationId TEXT,
      organizationName TEXT,
      active INTEGER DEFAULT 1,
      passwordHash TEXT,
      mustChangePassword INTEGER DEFAULT 0,
      failedLoginAttempts INTEGER DEFAULT 0,
      lockedUntil TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS workers (
      workerId TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      photoURL TEXT,
      address TEXT,
      primaryTeamId TEXT,
      primaryTeamName TEXT,
      teamAssignmentStatus TEXT DEFAULT 'UNASSIGNED',
      joiningDate TEXT,
      status TEXT DEFAULT 'ACTIVE',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS teamLeaders (
      leaderId TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      photoURL TEXT,
      managedTeamIds TEXT,
      permissions TEXT,
      status TEXT DEFAULT 'ACTIVE',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS teams (
      teamId TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      leaderIds TEXT,
      memberWorkerIds TEXT,
      status TEXT DEFAULT 'ACTIVE',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS locations (
      locationId TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      geofenceRadiusMeters REAL DEFAULT 100,
      status TEXT DEFAULT 'ACTIVE',
      photoURL TEXT,
      googleDriveFileId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS assignments (
      assignmentId TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      locationId TEXT,
      locationName TEXT,
      locationAddress TEXT,
      locationLatitude REAL,
      locationLongitude REAL,
      assignedBy TEXT,
      assignedByName TEXT,
      teamIds TEXT,
      workerIds TEXT,
      date TEXT NOT NULL,
      startTime TEXT,
      endTime TEXT,
      priority TEXT DEFAULT 'HIGH',
      status TEXT DEFAULT 'ASSIGNED',
      instructions TEXT,
      completionNote TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS attendance (
      attendanceId TEXT PRIMARY KEY,
      workerId TEXT NOT NULL,
      workerName TEXT NOT NULL,
      workerCode TEXT,
      teamId TEXT,
      teamName TEXT,
      assignmentId TEXT,
      assignmentTitle TEXT,
      date TEXT NOT NULL,
      checkInTime TEXT,
      checkInMethod TEXT,
      checkInLatitude REAL,
      checkInLongitude REAL,
      checkInAccuracy REAL,
      checkInDistanceMeters REAL,
      checkOutTime TEXT,
      checkOutMethod TEXT,
      checkOutLatitude REAL,
      checkOutLongitude REAL,
      checkOutAccuracy REAL,
      checkOutDistanceMeters REAL,
      workingMinutes INTEGER DEFAULT 0,
      status TEXT NOT NULL,
      verificationStatus TEXT DEFAULT 'UNVERIFIED',
      gpsStatus TEXT,
      photoStatus TEXT,
      checkInPhotoId TEXT,
      checkInPhotoUrl TEXT,
      checkInAddress TEXT,
      checkOutPhotoId TEXT,
      checkOutPhotoUrl TEXT,
      checkOutAddress TEXT,
      remarks TEXT,
      exceptionReason TEXT,
      exceptionStatus TEXT,
      markedBy TEXT,
      markedByName TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS workEvidence (
      evidenceId TEXT PRIMARY KEY,
      workerId TEXT NOT NULL,
      workerName TEXT NOT NULL,
      assignmentId TEXT NOT NULL,
      assignmentTitle TEXT,
      locationId TEXT,
      locationName TEXT,
      teamId TEXT,
      photoId TEXT,
      photoUrl TEXT NOT NULL,
      watermarkUrl TEXT,
      category TEXT NOT NULL,
      description TEXT,
      latitude REAL,
      longitude REAL,
      accuracyMeters REAL,
      detectedAddress TEXT,
      capturedAt TEXT NOT NULL,
      uploadedAt TEXT NOT NULL,
      reviewStatus TEXT DEFAULT 'PENDING',
      reviewedBy TEXT,
      reviewedByName TEXT,
      reviewedAt TEXT,
      reviewNotes TEXT,
      createdAt TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS activityLogs (
      logId TEXT PRIMARY KEY,
      actorId TEXT NOT NULL,
      actorName TEXT NOT NULL,
      actorRole TEXT NOT NULL,
      action TEXT NOT NULL,
      entityType TEXT NOT NULL,
      entityId TEXT NOT NULL,
      changes TEXT,
      timestamp TEXT NOT NULL
    )
  `);

  console.log('Tables created successfully in Turso!');

  // Now seed from store.json if store exists
  const storePath = path.join(__dirname, '..', 'data', 'store.json');
  if (fs.existsSync(storePath)) {
    const raw = fs.readFileSync(storePath, 'utf-8');
    const store = JSON.parse(raw);

    console.log('Seeding Turso database with authentic records from store.json...');

    // 1. Sync store collection
    await client.execute({
      sql: `INSERT OR REPLACE INTO workcrew_store (collection, data, updatedAt) VALUES (?, ?, ?)`,
      args: ['full_store', raw, new Date().toISOString()],
    });

    // 2. Populate users
    for (const u of store.users || []) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO users (uid, role, displayName, phone, email, photoURL, active, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [u.uid, u.role, u.displayName, u.phone || null, u.email || null, u.photoURL || null, u.active ? 1 : 0, u.createdAt, u.updatedAt],
      });
    }

    // 3. Populate workers
    for (const w of store.workers || []) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO workers (workerId, userId, name, phone, email, photoURL, address, primaryTeamId, primaryTeamName, joiningDate, status, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [w.workerId, w.userId, w.name, w.phone || null, w.email || null, w.photoURL || null, w.address || null, w.primaryTeamId || null, w.primaryTeamName || null, w.joiningDate || null, w.status || 'ACTIVE', w.createdAt, w.updatedAt],
      });
    }

    // 4. Populate teamLeaders
    for (const l of store.teamLeaders || []) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO teamLeaders (leaderId, userId, name, phone, email, photoURL, managedTeamIds, permissions, status, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [l.leaderId, l.userId, l.name, l.phone || null, l.email || null, l.photoURL || null, JSON.stringify(l.managedTeamIds || []), JSON.stringify(l.permissions || {}), l.status || 'ACTIVE', l.createdAt, l.updatedAt],
      });
    }

    // 5. Populate teams
    for (const t of store.teams || []) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO teams (teamId, name, description, leaderIds, memberWorkerIds, status, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [t.teamId, t.name, t.description || null, JSON.stringify(t.leaderIds || []), JSON.stringify(t.memberWorkerIds || []), t.status || 'ACTIVE', t.createdAt, t.updatedAt],
      });
    }

    // 6. Populate locations
    for (const loc of store.locations || []) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO locations (locationId, name, address, latitude, longitude, geofenceRadiusMeters, status, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [loc.locationId, loc.name, loc.address, loc.latitude, loc.longitude, loc.geofenceRadiusMeters || 100, loc.status || 'ACTIVE', loc.createdAt, loc.updatedAt],
      });
    }

    // 7. Populate assignments
    for (const a of store.assignments || []) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO assignments (assignmentId, title, description, locationId, locationName, locationAddress, locationLatitude, locationLongitude, assignedBy, assignedByName, teamIds, workerIds, date, startTime, endTime, priority, status, instructions, completionNote, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [a.assignmentId, a.title, a.description || null, a.locationId || null, a.locationName || null, a.locationAddress || null, a.locationLatitude || null, a.locationLongitude || null, a.assignedBy || null, a.assignedByName || null, JSON.stringify(a.teamIds || []), JSON.stringify(a.workerIds || []), a.date, a.startTime || null, a.endTime || null, a.priority || 'HIGH', a.status || 'ASSIGNED', a.instructions || null, a.completionNote || null, a.createdAt, a.updatedAt],
      });
    }

    // 8. Populate attendance
    for (const att of store.attendance || []) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO attendance (attendanceId, workerId, workerName, workerCode, teamId, teamName, assignmentId, assignmentTitle, date, checkInTime, checkInMethod, checkInLatitude, checkInLongitude, checkInAccuracy, checkInDistanceMeters, checkOutTime, checkOutMethod, workingMinutes, status, verificationStatus, gpsStatus, photoStatus, checkInPhotoId, checkInPhotoUrl, checkInAddress, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [att.attendanceId, att.workerId, att.workerName, att.workerCode || att.workerId, att.teamId || null, att.teamName || null, att.assignmentId || null, att.assignmentTitle || null, att.date, att.checkInTime || null, att.checkInMethod || null, att.checkInLatitude || null, att.checkInLongitude || null, att.checkInAccuracy || null, att.checkInDistanceMeters || null, att.checkOutTime || null, att.checkOutMethod || null, att.workingMinutes || 0, att.status, att.verificationStatus || 'UNVERIFIED', att.gpsStatus || null, att.photoStatus || null, att.checkInPhotoId || null, att.checkInPhotoUrl || null, att.checkInAddress || null, att.createdAt, att.updatedAt],
      });
    }

    // 9. Populate workEvidence
    for (const ev of store.workEvidence || []) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO workEvidence (evidenceId, workerId, workerName, assignmentId, assignmentTitle, locationId, locationName, teamId, photoId, photoUrl, watermarkUrl, category, description, latitude, longitude, accuracyMeters, detectedAddress, capturedAt, uploadedAt, reviewStatus, reviewedBy, reviewedByName, reviewedAt, reviewNotes, createdAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [ev.evidenceId, ev.workerId, ev.workerName, ev.assignmentId, ev.assignmentTitle || null, ev.locationId || null, ev.locationName || null, ev.teamId || null, ev.photoId || null, ev.photoUrl, ev.watermarkUrl || null, ev.category, ev.description || null, ev.latitude || null, ev.longitude || null, ev.accuracyMeters || null, ev.detectedAddress || null, ev.capturedAt, ev.uploadedAt, ev.reviewStatus || 'PENDING', ev.reviewedBy || null, ev.reviewedByName || null, ev.reviewedAt || null, ev.reviewNotes || null, ev.createdAt],
      });
    }

    // 10. Populate activityLogs
    for (const log of store.activityLogs || []) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO activityLogs (logId, actorId, actorName, actorRole, action, entityType, entityId, changes, timestamp)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [log.logId, log.actorId, log.actorName, log.actorRole, log.action, log.entityType, log.entityId, JSON.stringify(log.changes || {}), log.timestamp],
      });
    }

    console.log('Successfully seeded all tables into Turso cloud database!');
  }
}

migrate()
  .then(() => {
    console.log('Migration to Turso completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
