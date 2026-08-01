import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import logger from './lib/logger';
import { requestLogger } from './middleware/requestLogger.middleware';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import studentRoutes from './routes/student.routes';
import schoolRoutes from './routes/school.routes';
import assignmentRoutes from './routes/assignments.routes';
import materialRoutes from './routes/materials.routes';
import uploadRoutes from './routes/uploads.routes';
import questionRoutes from './routes/questions.routes';
import examRoutes from './routes/exams.routes';
import leaveRoutes from './routes/leave.routes';
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
app.use(requestLogger);

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
  ['/uploads', uploadRoutes],
  ['/questions', questionRoutes],
  ['/exams', examRoutes],
  ['/leave', leaveRoutes],
  ['/messages', messageRoutes],
  ['/notifications', notificationRoutes],
  ['/superadmin', superadminRoutes],
];

for (const [path, router] of routeMounts) {
  app.use(`/api${path}`, router);
  app.use(`/api/v1${path}`, router);
}

import prisma from './lib/prisma';
import { redis } from './lib/redis';
import { startLockingScheduler, startLowAttendanceAlertScheduler } from './services/scheduler.service';
import { startNotificationWorker } from './workers/notification.worker';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

// Liveness: is the process up and able to handle HTTP at all? Must never touch the DB/Redis —
// a load balancer / k8s liveness probe uses this to decide whether to kill+restart the pod, and
// a slow dependency shouldn't trigger a restart loop.
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'EDUsphere API is running' });
});

// Readiness: can this instance actually serve traffic? Checks the dependencies every request
// needs (DB, and Redis when configured) with short timeouts and fails closed, so a readiness
// probe can drain an instance with a dead DB connection or exhausted pool instead of routing
// live traffic into 500s.
app.get('/api/health/ready', async (_req, res) => {
  const checks: Record<string, 'ok' | 'error'> = {};
  let ready = true;

  try {
    await withTimeout(prisma.$queryRawUnsafe('SELECT 1'), 2000);
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
    ready = false;
  }

  if (redis) {
    try {
      await withTimeout(redis.ping(), 1000);
      checks.redis = 'ok';
    } catch {
      checks.redis = 'error';
      ready = false;
    }
  }

  res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not_ready', checks });
});

// Start server
const startServer = async () => {
  try {
    // Verify DB connection by running a real query
    await prisma.$queryRawUnsafe('SELECT 1');
    logger.info('Database connected successfully');

    startLockingScheduler();
    startLowAttendanceAlertScheduler();
    // No-op unless REDIS_URL is set; see src/lib/queue.ts
    startNotificationWorker();

    app.listen(PORT, () => {
      logger.info({ port: PORT }, 'Server running');
    });
  } catch (error) {
    logger.error({ err: error }, 'Database connection failed');
    process.exit(1);
  }
};

startServer();

export default app;
