import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import studentRoutes from './routes/student.routes';
import schoolRoutes from './routes/school.routes';
import assignmentRoutes from './routes/assignments.routes';
import materialRoutes from './routes/materials.routes';

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/school', schoolRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/materials', materialRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'EDUsphere API is running' });
});

import prisma from './lib/prisma';
import { startLockingScheduler } from './services/scheduler.service';

// Start server
const startServer = async () => {
  try {
    // Verify DB connection by running a real query
    await prisma.$queryRawUnsafe('SELECT 1');
    console.log('✅ Database connected successfully');

    startLockingScheduler();

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
