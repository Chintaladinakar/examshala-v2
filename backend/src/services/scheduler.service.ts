import prisma from '../lib/prisma';
import logger from '../lib/logger';

const LOW_ATTENDANCE_THRESHOLD_PERCENT = 75;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const startLockingScheduler = () => {
  logger.info('Attendance locking scheduler initialized');

  // Run immediately on start
  lockPastAttendance();

  // Run every hour
  setInterval(() => {
    lockPastAttendance();
  }, 1000 * 60 * 60);
};

export const startLowAttendanceAlertScheduler = () => {
  logger.info('Low attendance alert scheduler initialized');

  // Run immediately on start
  checkLowAttendance();

  // Run once a day
  setInterval(() => {
    checkLowAttendance();
  }, ONE_DAY_MS);
};

const lockPastAttendance = async () => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const result = await prisma.attendance.updateMany({
      where: {
        date: {
          lt: oneDayAgo,
        },
        isLocked: false,
      },
      data: {
        isLocked: true,
      },
    });

    if (result.count > 0) {
      logger.info({ count: result.count }, 'Auto-locked past attendance sheets');
    }
  } catch (error) {
    logger.error({ err: error }, 'Failed to run auto-locking batch job');
  }
};

// Computes each active student's trailing-30-day attendance percentage and notifies their
// workspace's principal(s) when it falls below LOW_ATTENDANCE_THRESHOLD_PERCENT. Guards against
// duplicate alerts by checking for an existing unread alert for the same student created today.
const checkLowAttendance = async () => {
  try {
    const windowStart = new Date(Date.now() - 30 * ONE_DAY_MS);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const workspaces = await prisma.workspace.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    for (const workspace of workspaces) {
      const principals = await prisma.user.findMany({
        where: { workspaceId: workspace.id, role: 'principal', isActive: true },
        select: { id: true },
      });
      if (principals.length === 0) continue;

      const students = await prisma.user.findMany({
        where: { workspaceId: workspace.id, role: 'student', isActive: true },
        select: { id: true, name: true },
      });
      if (students.length === 0) continue;

      const studentIds = students.map((s) => s.id);
      const records = await prisma.attendance.findMany({
        where: { studentId: { in: studentIds }, date: { gte: windowStart } },
        select: { studentId: true, status: true },
      });

      const byStudent = new Map<string, { present: number; marked: number }>();
      for (const r of records) {
        const stats = byStudent.get(r.studentId) || { present: 0, marked: 0 };
        stats.marked += 1;
        if (r.status === 'present' || r.status === 'late') stats.present += 1;
        byStudent.set(r.studentId, stats);
      }

      for (const student of students) {
        const stats = byStudent.get(student.id);
        if (!stats || stats.marked === 0) continue;

        const percentage = (stats.present / stats.marked) * 100;
        if (percentage >= LOW_ATTENDANCE_THRESHOLD_PERCENT) continue;

        for (const principal of principals) {
          const existingAlertToday = await prisma.notification.findFirst({
            where: {
              userId: principal.id,
              type: 'low_attendance_alert',
              actionUrl: student.id,
              createdAt: { gte: todayStart },
            },
            select: { id: true },
          });
          if (existingAlertToday) continue;

          await prisma.notification.create({
            data: {
              userId: principal.id,
              workspaceId: workspace.id,
              type: 'low_attendance_alert',
              title: 'Low Attendance Alert',
              message: `${student.name} has ${percentage.toFixed(1)}% attendance over the last 30 days, below the ${LOW_ATTENDANCE_THRESHOLD_PERCENT}% threshold.`,
              actionUrl: student.id,
            },
          });
        }
      }
    }
  } catch (error) {
    logger.error({ err: error }, 'Failed to run low-attendance alert job');
  }
};
