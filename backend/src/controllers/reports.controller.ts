import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';

async function loadRequestingUser(req: AuthRequest) {
  const userId = req.user?.userId;
  return prisma.user.findUnique({ where: { id: userId } });
}

export const getReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, message: 'Workspace mapping not found.' });
      return;
    }

    const targetUserId = (req.query.studentId as string) || '';
    const role = user.role.toLowerCase();
    const isTeacher = role === 'teacher';
    const isPrincipal = role === 'principal';

    if (!targetUserId && (isTeacher || isPrincipal)) {
      let studentWhere: any = { workspaceId: user.workspaceId, role: 'student' };
      if (isTeacher) {
        const links = await prisma.classTeacher.findMany({ where: { teacherId: user.id }, select: { classId: true } });
        const classIds = links.map((l) => l.classId);
        const classStudents = await prisma.classStudent.findMany({ where: { classId: { in: classIds } }, select: { studentId: true } });
        studentWhere = { id: { in: classStudents.map((s) => s.studentId) } };
      }

      const studentUsers = await prisma.user.findMany({
        where: studentWhere,
        select: {
          id: true, name: true, email: true, isActive: true,
          classStudents: { select: { Class: { select: { id: true, name: true } } } },
          results: { select: { percentage: true } },
          attendances: { select: { status: true } },
        },
        orderBy: { name: 'asc' },
      });

      const students = studentUsers.map((s) => {
        const cls = s.classStudents[0]?.Class || null;
        const avgScore = s.results.length ? s.results.reduce((acc, r) => acc + r.percentage, 0) / s.results.length : null;
        const presentCount = s.attendances.filter((a) => a.status === 'present' || a.status === 'late').length;
        const attendanceRate = s.attendances.length ? (presentCount / s.attendances.length) * 100 : null;
        return {
          id: s.id, name: s.name, email: s.email, isActive: s.isActive, class: cls,
          avgScore: avgScore !== null ? Math.round(avgScore * 10) / 10 : null,
          attendanceRate: attendanceRate !== null ? Math.round(attendanceRate * 10) / 10 : null,
        };
      });

      let tutors: any[] = [];
      if (isPrincipal) {
        const tutorUsers = await prisma.user.findMany({
          where: { workspaceId: user.workspaceId, role: { in: ['teacher', 'tutor'] } },
          select: {
            id: true, name: true, email: true, isActive: true,
            classTeachers: { select: { Class: { select: { id: true, name: true } } } },
            attendances: { select: { status: true } },
          },
          orderBy: { name: 'asc' },
        });
        tutors = tutorUsers.map((t) => {
          const classes = t.classTeachers.map((ct) => ct.Class);
          const presentCount = t.attendances.filter((a) => a.status === 'present' || a.status === 'late').length;
          const attendanceRate = t.attendances.length ? (presentCount / t.attendances.length) * 100 : null;
          return { id: t.id, name: t.name, email: t.email, isActive: t.isActive, classes, attendanceRate: attendanceRate !== null ? Math.round(attendanceRate * 10) / 10 : null };
        });
      }

      const scored = students.filter((s) => s.avgScore !== null);
      const attendanceScored = students.filter((s) => s.attendanceRate !== null);
      const tutorAttendanceScored = tutors.filter((t) => t.attendanceRate !== null);

      res.json({
        success: true,
        data: {
          isSummary: true,
          students,
          tutors,
          stats: {
            totalStudents: students.length,
            totalTutors: tutors.length,
            activeStudents: students.filter((s) => s.isActive).length,
            avgWorkspaceAttendance: attendanceScored.length ? Math.round((attendanceScored.reduce((a, s) => a + (s.attendanceRate || 0), 0) / attendanceScored.length) * 10) / 10 : null,
            avgTutorAttendance: tutorAttendanceScored.length ? Math.round((tutorAttendanceScored.reduce((a, t) => a + (t.attendanceRate || 0), 0) / tutorAttendanceScored.length) * 10) / 10 : null,
            avgWorkspaceScore: scored.length ? Math.round((scored.reduce((a, s) => a + (s.avgScore || 0), 0) / scored.length) * 10) / 10 : null,
          },
        },
      });
      return;
    }

    const profileUserId = targetUserId || user.id;

    const userInfo = await prisma.user.findFirst({
      where: { id: profileUserId, workspaceId: user.workspaceId },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    if (!userInfo) {
      res.status(404).json({ success: false, message: 'User profile not found in this workspace.' });
      return;
    }

    // A teacher may only pull up individual report cards for their own students.
    if (isTeacher && targetUserId && userInfo.role.toLowerCase() === 'student') {
      const links = await prisma.classTeacher.findMany({ where: { teacherId: user.id }, select: { classId: true } });
      const classIds = links.map((l) => l.classId);
      const enrolled = await prisma.classStudent.findFirst({ where: { studentId: profileUserId, classId: { in: classIds } } });
      if (!enrolled) {
        res.status(403).json({ success: false, message: 'This student is not in one of your classes.' });
        return;
      }
    }

    const isTargetTutor = ['teacher', 'tutor', 'principal'].includes(userInfo.role.toLowerCase());

    if (isTargetTutor) {
      if (isTeacher && profileUserId !== user.id) {
        res.status(403).json({ success: false, message: 'You can only view your own report card.' });
        return;
      }

      const attendance = await prisma.attendance.findMany({
        where: { studentId: profileUserId, Class: { workspaceId: user.workspaceId } },
        include: { Class: { select: { id: true, name: true } } },
        orderBy: { date: 'desc' },
      });

      const tutorClasses = await prisma.classTeacher.findMany({ where: { teacherId: profileUserId }, include: { Class: { select: { id: true, name: true } } } });
      const classes = tutorClasses.map((tc) => tc.Class);
      const classIds = classes.map((c) => c.id);

      const studentLinks = await prisma.classStudent.findMany({ where: { classId: { in: classIds } }, select: { studentId: true } });
      const classResults = await prisma.result.findMany({ where: { studentId: { in: studentLinks.map((s) => s.studentId) } }, orderBy: { createdAt: 'desc' } });

      res.json({ success: true, data: { isSummary: false, isTutor: true, tutor: userInfo, classes, attendance, classResults } });
      return;
    }

    const studentClasses = await prisma.classStudent.findMany({ where: { studentId: profileUserId }, include: { Class: { select: { id: true, name: true } } } });
    const classes = studentClasses.map((sc) => sc.Class);

    const attendance = await prisma.attendance.findMany({
      where: { studentId: profileUserId, Class: { workspaceId: user.workspaceId } },
      include: { Class: { select: { name: true } } },
      orderBy: { date: 'desc' },
    });

    const results = await prisma.result.findMany({ where: { studentId: profileUserId }, orderBy: { createdAt: 'desc' } });

    const attempts = await prisma.assessmentAttempt.findMany({
      where: { studentId: profileUserId },
      include: { Assignment: { include: { Test: { select: { title: true } } } }, Result: true },
      orderBy: { startedAt: 'desc' },
    });

    res.json({ success: true, data: { isSummary: false, isTutor: false, student: userInfo, classes, attendance, results, attempts } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
