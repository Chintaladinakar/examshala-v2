import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import studentRoutes from './routes/student.routes';
import schoolRoutes from './routes/school.routes';
import assignmentRoutes from './routes/assignments.routes';
import materialRoutes from './routes/materials.routes';
import questionRoutes from './routes/questions.routes';
import examRoutes from './routes/exams.routes';
import messageRoutes from './routes/messages.routes';
import notificationRoutes from './routes/notifications.routes';
import superadminRoutes from './routes/superadmin.routes';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Restrict CORS to the configured frontend origin only.
// Set FRONTEND_URL in .env to the domain that hosts the client (e.g. https://examshala.com).
const ALLOWED_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Routes
// Mounted under both the unversioned legacy path (kept for existing frontend clients)
// and /api/v1 (the path new/external integrations should target going forward).
const routeMounts: Array<[string, express.Router]> = [
  ['/auth', authRoutes],
  ['/admin', adminRoutes],
  ['/student', studentRoutes],
  ['/school', schoolRoutes],
  ['/assignments', assignmentRoutes],
  ['/materials', materialRoutes],
  ['/questions', questionRoutes],
  ['/exams', examRoutes],
  ['/messages', messageRoutes],
  ['/notifications', notificationRoutes],
  ['/superadmin', superadminRoutes],
];

for (const [path, router] of routeMounts) {
  app.use(`/api${path}`, router);
  app.use(`/api/v1${path}`, router);
}

// Health check
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'EDUsphere API is running' });
});

import prisma from './lib/prisma';
import { startLockingScheduler, startLowAttendanceAlertScheduler } from './services/scheduler.service';
import { startNotificationWorker } from './workers/notification.worker';

// Start server
const startServer = async () => {
  try {
    // Verify DB connection by running a real query
    await prisma.$queryRawUnsafe('SELECT 1');
    console.log('✅ Database connected successfully');

    startLockingScheduler();
    startLowAttendanceAlertScheduler();
    // No-op unless REDIS_URL is set; see src/lib/queue.ts
    startNotificationWorker();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

startServer();

export default app;
