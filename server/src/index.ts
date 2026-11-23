import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import workerRoutes from './routes/workers';
import leaderRoutes from './routes/leaders';
import teamRoutes from './routes/teams';
import locationRoutes from './routes/locations';
import assignmentRoutes from './routes/assignments';
import attendanceRoutes from './routes/attendance';
import reportRoutes from './routes/reports';
import notificationRoutes from './routes/notifications';
import settingsRoutes from './routes/settings';
import activityLogRoutes from './routes/activityLogs';
import leaveRoutes from './routes/leaves';
import workEvidenceRoutes from './routes/workEvidence';
import recognitionRoutes, { initializeFacialRecognitionIndex } from './routes/recognition';
import { ensureUploadDirs } from './utils/fileStorage';
import { db } from './db';

dotenv.config();
ensureUploadDirs();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static file hosting for captured camera photos & watermarks
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Request logging in development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`${req.method} ${req.originalUrl} [${res.statusCode}] - ${duration}ms`);
    }
  });
  next();
});

// Health check (available immediately without waiting for db hydration)
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'healthy',
    service: 'WorkCrew API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Ensure Turso database is fully hydrated from cloud before handling business requests
app.use(async (_req, _res, next) => {
  try {
    await db.ready();
  } catch (err: any) {
    console.warn('[SERVER] db ready error:', err?.message);
  }
  next();
});

// Mount modular REST routes (support both /api/xxx and /xxx)
const routeMap: [string, any][] = [
  ['/auth', authRoutes],
  ['/workers', workerRoutes],
  ['/leaders', leaderRoutes],
  ['/teams', teamRoutes],
  ['/locations', locationRoutes],
  ['/location', locationRoutes],
  ['/assignments', assignmentRoutes],
  ['/attendance', attendanceRoutes],
  ['/work-evidence', workEvidenceRoutes],
  ['/recognition', recognitionRoutes],
  ['/reports', reportRoutes],
  ['/notifications', notificationRoutes],
  ['/settings', settingsRoutes],
  ['/activity-logs', activityLogRoutes],
  ['/leaves', leaveRoutes],
];

for (const [routePath, routeHandler] of routeMap) {
  app.use(`/api${routePath}`, routeHandler);
  app.use(routePath, routeHandler);
}

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error', details: err?.message });
});

// Attach self-references so app is callable via default or named import in any bundler
(app as any).default = app;
(app as any).app = app;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = app;
}

const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  process.env.NOW_REGION
);

if (!isServerless) {
  const isDirectRun =
    (typeof require !== 'undefined' && require.main === module) ||
    (process.argv[1] && (process.argv[1].endsWith('index.ts') || process.argv[1].endsWith('index.js')));

  if (isDirectRun) {
    app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`  WORKCREW BACKEND REST API IS RUNNING  `);
      console.log(`  Port: http://localhost:${PORT}        `);
      console.log(`=========================================`);
      initializeFacialRecognitionIndex();
    });
  }
}

module.exports = app;
module.exports.default = app;
