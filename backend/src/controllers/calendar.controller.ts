import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';

async function loadRequestingUser(req: AuthRequest) {
  const userId = req.user?.userId;
  return prisma.user.findUnique({ where: { id: userId } });
}

type CalendarEvent = {
  id: string;
  type: 'assignment_due' | 'exam' | 'announcement';
  title: string;
  date: string;
  classId?: string;
  className?: string;
};

export const getCalendarEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, message: 'Workspace mapping not found.' });
      return;
    }

    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const isPrincipal = user.role.toLowerCase() === 'principal';
    let classIds: string[] | undefined;
    if (!isPrincipal) {
      const links = await prisma.classTeacher.findMany({ where: { teacherId: user.id }, select: { classId: true } });
      classIds = links.map((l) => l.classId);
    }

    const classWhere = classIds ? { classId: { in: classIds } } : { Class: { workspaceId: user.workspaceId } };

    const [assignments, exams, announcements] = await Promise.all([
      prisma.assignment.findMany({
        where: { ...classWhere, dueDate: { gte: start, lte: end } },
        select: { id: true, title: true, dueDate: true, classId: true, Class: { select: { name: true } } },
      }),
      prisma.exam.findMany({
        where: {
          workspaceId: user.workspaceId,
          ...(classIds ? { classId: { in: classIds } } : {}),
          status: 'published',
          OR: [
            { scheduledStart: { gte: start, lte: end } },
            { scheduledEnd: { gte: start, lte: end } },
          ],
        },
        select: { id: true, title: true, scheduledStart: true, scheduledEnd: true, classId: true, Class: { select: { name: true } } },
      }),
      prisma.notification.findMany({
        where: { workspaceId: user.workspaceId, type: 'announcement', createdAt: { gte: start, lte: end } },
        select: { id: true, title: true, createdAt: true },
      }),
    ]);

    const events: CalendarEvent[] = [];
    for (const a of assignments) {
      events.push({ id: `assignment-${a.id}`, type: 'assignment_due', title: `Due: ${a.title}`, date: a.dueDate.toISOString(), classId: a.classId, className: a.Class?.name });
    }
    for (const e of exams) {
      const date = e.scheduledStart || e.scheduledEnd;
      if (date) {
        events.push({ id: `exam-${e.id}`, type: 'exam', title: e.title, date: date.toISOString(), classId: e.classId, className: e.Class?.name });
      }
    }
    for (const n of announcements) {
      events.push({ id: `announcement-${n.id}`, type: 'announcement', title: n.title, date: n.createdAt.toISOString() });
    }

    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json({ success: true, data: events });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentCalendarEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.userId;
    const workspaceIdContext = (req.headers['x-workspace-id'] as string | undefined) || undefined;

    const memberships = await prisma.classStudent.findMany({
      where: { studentId, ...(workspaceIdContext ? { Class: { workspaceId: workspaceIdContext } } : {}) },
      select: { classId: true },
    });
    const classIds = memberships.map((m) => m.classId);

    const workspace = workspaceIdContext
      ? { id: workspaceIdContext }
      : await prisma.user.findUnique({ where: { id: studentId }, select: { workspaceId: true } }).then((u) => (u?.workspaceId ? { id: u.workspaceId } : null));

    if (!workspace) {
      res.json({ success: true, data: [] });
      return;
    }

    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const [assignments, exams, announcements] = await Promise.all([
      prisma.assignment.findMany({
        where: { classId: { in: classIds }, dueDate: { gte: start, lte: end } },
        select: { id: true, title: true, dueDate: true, classId: true, Class: { select: { name: true } } },
      }),
      prisma.exam.findMany({
        where: {
          workspaceId: workspace.id,
          classId: { in: classIds },
          status: 'published',
          OR: [
            { scheduledStart: { gte: start, lte: end } },
            { scheduledEnd: { gte: start, lte: end } },
          ],
        },
        select: { id: true, title: true, scheduledStart: true, scheduledEnd: true, classId: true, Class: { select: { name: true } } },
      }),
      prisma.notification.findMany({
        where: { workspaceId: workspace.id, type: 'announcement', createdAt: { gte: start, lte: end } },
        select: { id: true, title: true, createdAt: true },
      }),
    ]);

    const events: CalendarEvent[] = [];
    for (const a of assignments) {
      events.push({ id: `assignment-${a.id}`, type: 'assignment_due', title: `Due: ${a.title}`, date: a.dueDate.toISOString(), classId: a.classId, className: a.Class?.name });
    }
    for (const e of exams) {
      const date = e.scheduledStart || e.scheduledEnd;
      if (date) {
        events.push({ id: `exam-${e.id}`, type: 'exam', title: e.title, date: date.toISOString(), classId: e.classId, className: e.Class?.name });
      }
    }
    for (const n of announcements) {
      events.push({ id: `announcement-${n.id}`, type: 'announcement', title: n.title, date: n.createdAt.toISOString() });
    }

    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json({ success: true, data: events });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
