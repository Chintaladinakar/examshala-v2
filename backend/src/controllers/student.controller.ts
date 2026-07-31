import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as dashboardService from '../services/studentDashboard.service';
import * as assignmentService from '../services/assignment.service';
import * as parentLinkService from '../services/parentLink.service';
import * as resultsService from '../services/results.service';
import * as notificationsService from '../services/notifications.service';
import * as profileService from '../services/studentProfile.service';
import prisma from '../lib/prisma';
import { cached, cacheDel } from '../lib/redis';
import { isFeatureEnabled } from '../lib/featureFlags';
import { resolveLocale, t } from '../lib/i18n';

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const workspaceIdContext = req.headers['x-workspace-id'] as string | undefined;

    // 30s cache: dashboard aggregates several queries and is hit on every page nav.
    // Falls through to an uncached call automatically when REDIS_URL isn't set.
    const cacheKey = `student:dashboard:${studentId}:${workspaceIdContext || 'default'}`;
    const data = await cached(cacheKey, 30, () =>
      dashboardService.getDashboardAggregatedData(studentId, workspaceIdContext)
    );

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const { assignmentId } = req.params;

    const data = await assignmentService.getAssignmentDetails(studentId, assignmentId as string);
    
    res.json({ success: true, data });
  } catch (error: any) {
    if (error.message.includes('Access denied')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const requestParentLink = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const { email, relation } = req.body;

    if (!email || !relation) {
      return res.status(400).json({ success: false, message: 'Email and relation are required' });
    }

    const data = await parentLinkService.requestParentLink(studentId, email, relation);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getParents = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const data = await parentLinkService.getStudentParents(studentId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeParentLink = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const { linkId } = req.body;
    
    if (!linkId) {
      return res.status(400).json({ success: false, message: 'linkId is required' });
    }

    const data = await parentLinkService.requestLinkRemoval(studentId, linkId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getResults = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const workspaceIdContext = req.headers['x-workspace-id'] as string | undefined;
    const data = await resultsService.getStudentResults(studentId, workspaceIdContext);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getResultById = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const { id } = req.params;
    const data = await resultsService.getStudentResultById(studentId, id as string);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const workspaceIdContext = req.headers['x-workspace-id'] as string | undefined;
    const data = await notificationsService.getStudentNotifications(studentId, workspaceIdContext);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markNotificationsRead = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: 'ids array is required' });
    }
    await notificationsService.markNotificationsRead(studentId, ids);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const workspaceIdContext = req.headers['x-workspace-id'] as string | undefined;

    const data = await dashboardService.getScheduleAggregatedData(studentId, workspaceIdContext);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const workspaceIdContext = req.headers['x-workspace-id'] as string | undefined;
    const data = await profileService.getStudentProfile(studentId, workspaceIdContext);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const workspaceIdContext = req.headers['x-workspace-id'] as string | undefined;
    const { classId, from, to } = req.query as { classId?: string; from?: string; to?: string };
    const data = await dashboardService.getAttendanceAggregatedData(studentId, workspaceIdContext, { classId, from, to });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAnnouncements = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const workspaceIdContext = req.headers['x-workspace-id'] as string | undefined;
    const search = (req.query.search as string | undefined)?.trim();

    let workspaceId = workspaceIdContext;
    if (!workspaceId) {
      const user = await prisma.user.findUnique({ where: { id: studentId }, select: { workspaceId: true } });
      workspaceId = user?.workspaceId || undefined;
    }

    if (!workspaceId) {
      res.json({ success: true, data: [] });
      return;
    }

    const where: any = { workspaceId, type: 'announcement' };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    const announcements = await prisma.notification.findMany({
      where,
      select: { id: true, title: true, message: true, actionUrl: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: announcements });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGlobalSearch = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const workspaceIdContext = req.headers['x-workspace-id'] as string | undefined;
    const q = ((req.query.q as string) || '').trim();

    if (!q) {
      res.json({ success: true, data: { materials: [], assignments: [], exams: [], announcements: [] } });
      return;
    }

    let workspaceId = workspaceIdContext;
    if (!workspaceId) {
      const user = await prisma.user.findUnique({ where: { id: studentId }, select: { workspaceId: true } });
      workspaceId = user?.workspaceId || undefined;
    }

    if (!workspaceId) {
      res.json({ success: true, data: { materials: [], assignments: [], exams: [], announcements: [] } });
      return;
    }

    const classMemberships = await prisma.classStudent.findMany({ where: { studentId }, select: { classId: true } });
    const classIds = classMemberships.map((m) => m.classId);

    const insensitive = { mode: 'insensitive' as const };

    const [materials, assignments, exams, announcements] = await Promise.all([
      prisma.material.findMany({
        where: {
          workspaceId,
          OR: [
            { title: { contains: q, ...insensitive } },
            { subject: { contains: q, ...insensitive } },
            { topic: { contains: q, ...insensitive } },
          ],
        },
        select: { id: true, title: true, subject: true, type: true },
        take: 10,
      }),
      prisma.assignment.findMany({
        where: {
          classId: { in: classIds },
          title: { contains: q, ...insensitive },
        },
        select: { id: true, title: true, dueDate: true },
        take: 10,
      }),
      prisma.exam.findMany({
        where: {
          workspaceId,
          classId: { in: classIds },
          title: { contains: q, ...insensitive },
        },
        select: { id: true, title: true, examType: true },
        take: 10,
      }),
      prisma.notification.findMany({
        where: {
          workspaceId,
          type: 'announcement',
          title: { contains: q, ...insensitive },
        },
        select: { id: true, title: true, createdAt: true },
        take: 10,
      }),
    ]);

    res.json({ success: true, data: { materials, assignments, exams, announcements } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    if (!isFeatureEnabled('leaderboard')) {
      res.status(404).json({ success: false, code: 'FEATURE_DISABLED', message: t(resolveLocale(req), 'error.notFound') });
      return;
    }

    const studentId = req.user!.userId;
    const workspaceIdContext = req.headers['x-workspace-id'] as string | undefined;

    const classMemberships = await prisma.classStudent.findMany({ where: { studentId }, select: { classId: true } });
    const classIds = classMemberships.map((m) => m.classId);

    if (classIds.length === 0) {
      res.json({ success: true, data: { rankings: [], myRank: null } });
      return;
    }

    const examWhere: any = { classId: { in: classIds } };
    if (workspaceIdContext) examWhere.workspaceId = workspaceIdContext;

    const exams = await prisma.exam.findMany({ where: examWhere, select: { id: true } });
    const examIds = exams.map((e) => e.id);

    if (examIds.length === 0) {
      res.json({ success: true, data: { rankings: [], myRank: null } });
      return;
    }

    const results = await prisma.result.findMany({
      where: { examId: { in: examIds } },
      select: { studentId: true, percentage: true },
    });

    const peerIds = (
      await prisma.classStudent.findMany({ where: { classId: { in: classIds } }, select: { studentId: true } })
    ).map((m) => m.studentId);
    const peerIdSet = new Set(peerIds);

    const byStudent = new Map<string, { total: number; count: number }>();
    for (const r of results) {
      if (!peerIdSet.has(r.studentId)) continue;
      const entry = byStudent.get(r.studentId) || { total: 0, count: 0 };
      entry.total += r.percentage;
      entry.count += 1;
      byStudent.set(r.studentId, entry);
    }

    const studentIds = Array.from(byStudent.keys());
    const users = await prisma.user.findMany({ where: { id: { in: studentIds } }, select: { id: true, name: true } });
    const nameMap = new Map(users.map((u) => [u.id, u.name]));

    const rankings = studentIds
      .map((id) => {
        const { total, count } = byStudent.get(id)!;
        return { studentId: id, name: nameMap.get(id) || 'Student', averageScore: Math.round((total / count) * 10) / 10 };
      })
      .sort((a, b) => b.averageScore - a.averageScore)
      .map((r, idx) => ({ ...r, rank: idx + 1 }));

    const myRank = rankings.find((r) => r.studentId === studentId) || null;

    res.json({ success: true, data: { rankings: rankings.slice(0, 20), myRank } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubjects = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const workspaceIdContext = req.headers['x-workspace-id'] as string | undefined;

    const classWhere: any = { students: { some: { studentId } } };
    if (workspaceIdContext) classWhere.workspaceId = workspaceIdContext;

    const classes = await prisma.class.findMany({
      where: classWhere,
      select: { id: true, name: true, departmentId: true, Department: { select: { id: true, name: true } } },
    });

    const departmentIds = Array.from(new Set(classes.map((c) => c.departmentId).filter((id): id is string => !!id)));

    if (departmentIds.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    const subjects = await prisma.subject.findMany({
      where: { departmentId: { in: departmentIds } },
      include: {
        teachers: { include: { Teacher: { select: { id: true, name: true, email: true } } } },
      },
      orderBy: { name: 'asc' },
    });

    const data = subjects.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      departmentId: s.departmentId,
      teachers: s.teachers.map((ts) => ts.Teacher),
      classes: classes.filter((c) => c.departmentId === s.departmentId).map((c) => ({ id: c.id, name: c.name })),
    }));

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTimetable = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const workspaceIdContext = req.headers['x-workspace-id'] as string | undefined;

    const classWhere: any = { students: { some: { studentId } } };
    if (workspaceIdContext) classWhere.workspaceId = workspaceIdContext;

    const classes = await prisma.class.findMany({ where: classWhere, select: { id: true, name: true } });
    const classIds = classes.map((c) => c.id);

    if (classIds.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    const slots = await prisma.timetableSlot.findMany({
      where: { classId: { in: classIds } },
      include: {
        Subject: { select: { id: true, name: true } },
        Teacher: { select: { id: true, name: true } },
        Class: { select: { id: true, name: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    res.json({ success: true, data: slots });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const workspaceIdContext = req.headers['x-workspace-id'] as string | undefined;
    const data = await profileService.getStudentSettings(studentId, workspaceIdContext);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateNotificationSettings = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const workspaceIdContext = req.headers['x-workspace-id'] as string | undefined;
    const data = await profileService.updateNotificationSettings(studentId, workspaceIdContext, req.body);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfilePhoto = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const workspaceIdContext = req.headers['x-workspace-id'] as string | undefined;
    const { profilePhoto } = req.body;
    const data = await profileService.updateProfilePhoto(studentId, workspaceIdContext, profilePhoto);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;
    const data = await profileService.changePassword(studentId, currentPassword, newPassword);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateProfileInfo = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const workspaceIdContext = req.headers['x-workspace-id'] as string | undefined;
    const data = await profileService.updateProfileInfo(studentId, workspaceIdContext, req.body);
    await cacheDel(`student:dashboard:${studentId}:${workspaceIdContext || 'default'}`);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

