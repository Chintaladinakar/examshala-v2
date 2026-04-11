import prisma from '../lib/prisma';

export const getDashboardAggregatedData = async (studentId: string, workspaceIdContext?: string) => {
  // Fetch basic profile
  const user = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, email: true },
  });

  if (!user) throw new Error('Student not found');

  // Pending work (actionable notifications)
  const notificationsParams: any = { userId: studentId, isRead: false };
  if (workspaceIdContext) {
    notificationsParams.workspaceId = workspaceIdContext;
  }
  
  const rawNotifications = await prisma.notification.findMany({
    where: notificationsParams,
    orderBy: { createdAt: 'desc' },
  });

  // Group notifications by type
  const groupedNotifications = rawNotifications.reduce((acc: any, notif) => {
    if (!acc[notif.type]) acc[notif.type] = [];
    acc[notif.type].push(notif);
    return acc;
  }, {});

  // Overall Progress
  const attemptParams: any = { studentId: studentId, status: 'evaluated' };
  if (workspaceIdContext) {
    attemptParams.Assignment = { workspaceId: workspaceIdContext };
  }

  const evaluatedAttempts = await prisma.assessmentAttempt.findMany({
    where: attemptParams,
    include: { Result: true },
  });

  const totalExamsTaken = evaluatedAttempts.length;
  const averageScore = evaluatedAttempts.reduce((acc, a) => acc + (a.Result?.score || 0), 0) / (totalExamsTaken || 1);

  // Upcoming Exams
  const upcomingExamsParams: any = { 
    attempts: { none: { studentId: studentId } },
    isReady: true 
  };
  
  if (workspaceIdContext) {
    upcomingExamsParams.workspaceId = workspaceIdContext;
  } else {
    upcomingExamsParams.Workspace = {
      memberships: {
        some: { userId: studentId }
      }
    };
  }

  const upcomingExams = await prisma.assessmentAssignment.findMany({
    where: upcomingExamsParams,
    take: 5,
    orderBy: { assignedAt: 'desc' },
    include: { Test: { select: { title: true, duration: true } } }
  });

  // Recent results
  const recentResults = await prisma.assessmentAttempt.findMany({
    where: { ...attemptParams },
    take: 5,
    orderBy: { submittedAt: 'desc' },
    include: { 
      Result: true,
      Assignment: { include: { Test: { select: { title: true } } } }
    }
  });

  // linked parent count
  const linkedParentsCount = await prisma.parentStudentLink.count({
    where: { studentId: studentId, status: 'active' }
  });

  return {
    profile: user,
    stats: {
      totalExamsTaken,
      averageScore: Number(averageScore.toFixed(2)),
      linkedParentCount: linkedParentsCount,
    },
    upcomingExams: upcomingExams.map(ex => ({
      id: ex.id,
      title: ex.Test.title,
      duration: ex.Test.duration,
      assignedBy: ex.assignedByName,
      assignedType: ex.assignedByType,
      assignedAt: ex.assignedAt,
      startWindow: ex.scheduleWindowStart
    })),
    recentResults: recentResults.map(r => ({
      id: r.id,
      title: r.Assignment.Test.title,
      score: r.Result?.score,
      maxScore: r.Result?.maxScore,
      submittedAt: r.submittedAt
    })),
    pendingWork: {
      groupedNotifications
    }
  };
};
