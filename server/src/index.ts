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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'WorkCrew API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount modular REST routes
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/leaders', leaderRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/work-evidence', workEvidenceRoutes);
app.use('/api/recognition', recognitionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/leaves', leaveRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error', details: err?.message });
});

export default app;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`  WORKCREW BACKEND REST API IS RUNNING  `);
    console.log(`  Port: http://localhost:${PORT}        `);
    console.log(`=========================================`);
    initializeFacialRecognitionIndex();
  });
}
