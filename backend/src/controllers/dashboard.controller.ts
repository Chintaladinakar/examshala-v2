import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';

export const getTutorDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const isPrincipal = user.role.toLowerCase() === 'principal';
    const isTeacher = user.role.toLowerCase() === 'teacher';
    if (!isPrincipal && !isTeacher) {
      res.status(403).json({ success: false, code: 'ACCESS_DENIED', message: 'Only teachers and principals can view this dashboard.' });
      return;
    }

    // Principal in "principal mode" sees the whole workspace; a teacher (or principal in
    // teacher mode) only sees classes they are actually assigned to.
    const inPrincipalMode = isPrincipal && user.mode !== 'teacher';

    let classWhere: any = { workspaceId: user.workspaceId };
    if (!inPrincipalMode) {
      const teacherLinks = await prisma.classTeacher.findMany({
        where: { teacherId: user.id, Class: { workspaceId: user.workspaceId } },
        select: { classId: true },
      });
      classWhere = { workspaceId: user.workspaceId, id: { in: teacherLinks.map((t) => t.classId) } };
    }

    const classes = await prisma.class.findMany({ where: classWhere, select: { id: true, name: true } });
    const classIds = classes.map((c) => c.id);

    const classStudents = await prisma.classStudent.findMany({
      where: { classId: { in: classIds } },
      select: { classId: true, studentId: true },
    });
    const studentIds = Array.from(new Set(classStudents.map((cs) => cs.studentId)));

    const assignedClassesCount = classes.length;
    const assignedStudentsCount = studentIds.length;

    const assignmentsCreatedCount = await prisma.assignment.count({
      where: {
        classId: { in: classIds },
        Class: { workspaceId: user.workspaceId },
        ...(inPrincipalMode ? {} : { createdByUserId: user.id }),
      },
    });

    const pendingExamsCount = await prisma.assessmentAttempt.count({
      where: { status: 'submitted', studentId: { in: studentIds }, Assignment: { workspaceId: user.workspaceId } },
    });

    const workspaceAssignments = await prisma.assignment.findMany({
      where: { classId: { in: classIds }, Class: { workspaceId: user.workspaceId } },
      select: { id: true, title: true, dueDate: true, Class: { select: { name: true } } },
    });
    const assignmentIds = workspaceAssignments.map((a) => a.id);

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId: { in: assignmentIds } },
      select: { id: true, assignmentId: true, studentId: true },
    });

    const feedbacks = await prisma.assignmentFeedback.findMany({
      where: { assignmentId: { in: assignmentIds } },
      select: { assignmentId: true, createdByUserId: true },
    });
    const feedbackSet = new Set(feedbacks.map((f) => `${f.assignmentId}-${f.createdByUserId}`));

    let pendingAssignmentsCount = 0;
    const pendingGradingList: { id: string; name: string; type: string; class: string; pendingCount: number }[] = [];
    const submissionsByAssignment = new Map<string, number>();
    for (const sub of submissions) {
      submissionsByAssignment.set(sub.assignmentId, (submissionsByAssignment.get(sub.assignmentId) || 0) + 1);
      if (!feedbackSet.has(`${sub.assignmentId}-${user.id}`)) pendingAssignmentsCount++;
    }
    for (const a of workspaceAssignments) {
      const submitted = submissionsByAssignment.get(a.id) || 0;
      if (submitted > 0) {
        pendingGradingList.push({ id: a.id, name: a.title, type: 'Assignment', class: a.Class?.name || '', pendingCount: submitted });
      }
    }
    pendingGradingList.sort((a, b) => b.pendingCount - a.pendingCount);

    const pendingGradingCount = pendingExamsCount + pendingAssignmentsCount;

    // Announcements bulletin (stored as Notification with type='announcement')
    const announcements = await prisma.notification.findMany({
      where: { workspaceId: user.workspaceId, type: 'announcement' },
      select: { id: true, title: true, message: true, actionUrl: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Today's attendance summary
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const attendances = await prisma.attendance.findMany({
      where: { classId: { in: classIds }, date: { gte: todayStart, lte: todayEnd } },
      select: { status: true },
    });
    let present = 0, absent = 0, late = 0;
    for (const att of attendances) {
      const status = att.status.toLowerCase();
      if (status === 'present') present++;
      else if (status === 'absent') absent++;
      else if (status === 'late') late++;
    }

    const overdueAssignments = await prisma.assignment.count({
      where: { classId: { in: classIds }, dueDate: { lt: new Date() }, Class: { workspaceId: user.workspaceId }, submissions: { none: {} } },
    });

    const totalAssignments = assignmentsCreatedCount;
    const submittedAssignments = submissions.length;
    const pendingAssignments = Math.max(0, totalAssignments * assignedStudentsCount - submittedAssignments);

    // Performance overview, computed only from real Result rows.
    const results = await prisma.result.findMany({
      where: { studentId: { in: studentIds } },
      select: { score: true, totalMarks: true, subject: true, studentId: true },
    });

    let totalScore = 0, totalMarks = 0, passCount = 0;
    const subjectScores: Record<string, { total: number; count: number }> = {};
    for (const r of results) {
      totalScore += r.score;
      totalMarks += r.totalMarks;
      const pct = r.totalMarks > 0 ? (r.score / r.totalMarks) * 100 : 0;
      if (pct >= 40) passCount++;
      const subj = r.subject || 'General';
      if (!subjectScores[subj]) subjectScores[subj] = { total: 0, count: 0 };
      subjectScores[subj].total += pct;
      subjectScores[subj].count++;
    }

    const averageScore = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : null;
    const passPercentage = results.length > 0 ? Math.round((passCount / results.length) * 100) : null;

    const classAverageScores: { className: string; average: number | null }[] = [];
    for (const c of classes) {
      const cStudentIds = classStudents.filter((cs) => cs.classId === c.id).map((cs) => cs.studentId);
      const cResults = results.filter((r) => cStudentIds.includes(r.studentId));
      let cSum = 0, cMax = 0;
      for (const r of cResults) {
        cSum += r.score;
        cMax += r.totalMarks;
      }
      classAverageScores.push({ className: c.name, average: cMax > 0 ? Math.round((cSum / cMax) * 100) : null });
    }

    const scoredClasses = classAverageScores.filter((c) => c.average !== null) as { className: string; average: number }[];
    let topClass: string | null = null;
    let weakestClass: string | null = null;
    if (scoredClasses.length > 0) {
      const sorted = [...scoredClasses].sort((a, b) => b.average - a.average);
      topClass = sorted[0].className;
      weakestClass = sorted[sorted.length - 1].className;
    }

    const subjectPerformanceTrend = Object.keys(subjectScores).map((subj) => ({
      subject: subj,
      score: Math.round(subjectScores[subj].total / subjectScores[subj].count),
    }));

    // Recent activity, from real audit trail
    const logs = await prisma.schoolLog.findMany({
      where: { User: { workspaceId: user.workspaceId } },
      select: { id: true, actionType: true, timestamp: true, entityId: true, User: { select: { name: true } } },
      orderBy: { timestamp: 'desc' },
      take: 8,
    });

    const ACTION_LABELS: Record<string, string> = {
      attendance_marked: 'Attendance registry marked',
      attendance_updated: 'Attendance registry modified',
      assignment_created: 'New classroom assignment created',
      feedback_added: 'Assignment evaluation feedback uploaded',
      student_created: 'New student profile created',
      class_created: 'New workspace classroom registered',
    };
    const recentActivityFeed = logs.map((l) => ({
      id: l.id,
      type: l.actionType,
      description: ACTION_LABELS[l.actionType] || l.actionType.replace(/_/g, ' '),
      timestamp: l.timestamp,
      actor: l.User?.name || 'Tutor',
    }));

    let workspaceOverview = null;
    let teacherActivitySummary = null;

    if (inPrincipalMode) {
      const [totalTeachers, totalStudents, totalClasses, activeExams] = await Promise.all([
        prisma.user.count({ where: { workspaceId: user.workspaceId, role: { in: ['teacher', 'tutor'] } } }),
        prisma.user.count({ where: { workspaceId: user.workspaceId, role: 'student' } }),
        prisma.class.count({ where: { workspaceId: user.workspaceId } }),
        prisma.assessmentAssignment.count({ where: { workspaceId: user.workspaceId, isReady: true } }),
      ]);
      workspaceOverview = { totalTeachers, totalStudents, totalClasses, activeExams };

      const teachers = await prisma.user.findMany({
        where: { workspaceId: user.workspaceId, role: { in: ['teacher', 'tutor'] } },
        select: { id: true, name: true },
      });

      teacherActivitySummary = await Promise.all(
        teachers.map(async (t) => {
          const [classesAssigned, examsCreated, assignmentsCreated] = await Promise.all([
            prisma.classTeacher.count({ where: { teacherId: t.id } }),
            prisma.assessmentAssignment.count({ where: { assignedByUserId: t.id, workspaceId: user.workspaceId! } }),
            prisma.assignment.count({ where: { createdByUserId: t.id } }),
          ]);
          return { id: t.id, teacherName: t.name, classesAssigned, examsCreated, assignmentsCreated };
        })
      );
    }

    const todayDayOfWeek = new Date().getDay();
    const todaysSlots = await prisma.timetableSlot.findMany({
      where: { workspaceId: user.workspaceId, classId: { in: classIds }, dayOfWeek: todayDayOfWeek },
      include: { Class: { select: { name: true } }, Subject: { select: { name: true } } },
      orderBy: { startTime: 'asc' },
    });
    const upcomingClasses = todaysSlots.map((s) => ({
      id: s.id,
      className: s.Class.name,
      subject: s.Subject?.name || 'General',
      startTime: s.startTime,
      endTime: s.endTime,
    }));

    res.status(200).json({
      success: true,
      data: {
        stats: {
          assignedClasses: assignedClassesCount,
          assignedStudents: assignedStudentsCount,
          totalAssignments: assignmentsCreatedCount,
          pendingGrading: pendingGradingCount,
        },
        pendingGradingList,
        upcomingClasses,
        announcements,
        attendanceSummary: { present, absent, late },
        assignmentAnalytics: {
          total: totalAssignments,
          submitted: submittedAssignments,
          pending: pendingAssignments,
          overdue: overdueAssignments,
        },
        performanceOverview: {
          averageScore,
          passPercentage,
          topClass,
          weakestClass,
          subjectPerformanceTrend,
          classAverageScores,
        },
        recentActivityFeed,
        workspaceOverview,
        teacherActivitySummary,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message || 'Internal server error' });
  }
};
