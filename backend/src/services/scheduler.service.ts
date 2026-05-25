import prisma from '../lib/prisma';

export const startLockingScheduler = () => {
  console.log('⏰ Attendance Locking Scheduler Initialized.');

  // Run immediately on start
  lockPastAttendance();

  // Run every hour
  setInterval(() => {
    lockPastAttendance();
  }, 1000 * 60 * 60);
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
      console.log(`🔒 Auto-locked ${result.count} past attendance sheets.`);
    }
  } catch (error) {
    console.error('❌ Failed to run auto-locking batch job:', error);
  }
};
