import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import superadminRoutes from './routes/superadmin.routes';
import studentRoutes from './routes/student.routes';
import schoolRoutes from './routes/school.routes';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/school', schoolRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'Examshala API is running' });
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
