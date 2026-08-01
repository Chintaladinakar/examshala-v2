import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import { isMailConfigured, sendUserInvitationEmail } from '../services/mail.service';
import logger from '../lib/logger';

async function loadPrincipal(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.workspaceId) {
    res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
    return null;
  }
  if (user.role.toLowerCase() !== 'principal') {
    res.status(403).json({ success: false, code: 'ACCESS_DENIED', message: 'Only the Principal can manage teachers.' });
    return null;
  }
  return user;
}

async function generateFancyUserId(role: string): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let prefix = 'US-';
  const roleLower = role.toLowerCase();
  if (roleLower === 'student') prefix = 'ST-';
  else if (roleLower === 'tutor' || roleLower === 'teacher') prefix = 'TR-';
  else if (roleLower === 'principal') prefix = 'PR-';
  else if (roleLower === 'org_admin') prefix = 'AD-';

  for (let attempts = 0; attempts < 50; attempts++) {
    let code = prefix;
    for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    const existing = await prisma.user.findUnique({ where: { id: code } });
    if (!existing) return code;
  }
  return `${prefix}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
}

export const listTeachersDetailed = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await loadPrincipal(req, res);
  if (!user) return;
  try {
    const teachers = await prisma.user.findMany({
      where: { workspaceId: user.workspaceId!, role: { in: ['teacher', 'tutor'] } },
      select: { id: true, name: true, email: true, isActive: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    const teacherIds = teachers.map((t) => t.id);

    const classTeachers = await prisma.classTeacher.findMany({
      where: { Class: { workspaceId: user.workspaceId! } },
      include: { Class: { select: { id: true, name: true } } },
    });
    const classMap = new Map<string, { id: string; name: string }[]>();
    for (const ct of classTeachers) {
      const list = classMap.get(ct.teacherId) || [];
      list.push(ct.Class);
      classMap.set(ct.teacherId, list);
    }

    const teacherSubjects = await prisma.teacherSubject.findMany({
      where: { teacherId: { in: teacherIds } },
      include: { Subject: { select: { id: true, name: true } } },
    });
    const subjectMap = new Map<string, { id: string; name: string }[]>();
    for (const ts of teacherSubjects) {
      const list = subjectMap.get(ts.teacherId) || [];
      list.push(ts.Subject);
      subjectMap.set(ts.teacherId, list);
    }

    const assignmentsCount = await prisma.assignment.groupBy({
      by: ['createdByUserId'],
      where: { createdByUserId: { in: teacherIds } },
      _count: { id: true },
    });
    const assignmentMap = new Map(assignmentsCount.map((a) => [a.createdByUserId, a._count.id]));

    const examsCount = await prisma.exam.groupBy({
      by: ['createdByUserId'],
      where: { createdByUserId: { in: teacherIds } },
      _count: { id: true },
    });
    const examMap = new Map(examsCount.map((e) => [e.createdByUserId, e._count.id]));

    res.json({
      success: true,
      data: teachers.map((t) => ({
        id: t.id,
        name: t.name,
        email: t.email,
        subjects: subjectMap.get(t.id) || [],
        classes: classMap.get(t.id) || [],
        assignmentsCreated: assignmentMap.get(t.id) || 0,
        examsCreated: examMap.get(t.id) || 0,
        isActive: t.isActive,
        status: t.status,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createOrAssociateTeacher = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await loadPrincipal(req, res);
  if (!user) return;
  try {
    const body = req.body as {
      mode?: 'associate' | 'create';
      uniqueId?: string;
      name?: string;
      email?: string;
      password?: string;
      subjectIds?: string[];
      classIds?: string[];
    };
    const mode = body.mode || 'create';

    let teacher: { id: string; name: string; email: string; isActive: boolean; status: string };
    let generatedPassword = '';

    if (mode === 'associate') {
      const uniqueId = (body.uniqueId || '').trim();
      if (!uniqueId) {
        res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'Unique ID/Email/Username is required for association.' });
        return;
      }

      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ id: uniqueId }, { email: uniqueId.toLowerCase() }, { username: uniqueId }], role: { in: ['teacher', 'tutor'] } },
      });
      if (!existingUser) {
        res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'No teacher or tutor account found with the provided identifier.' });
        return;
      }

      teacher = await prisma.user.update({
        where: { id: existingUser.id },
        data: { workspaceId: user.workspaceId! },
        select: { id: true, name: true, email: true, isActive: true, status: true },
      });

      await prisma.workspaceMembership.upsert({
        where: { userId_workspaceId: { userId: teacher.id, workspaceId: user.workspaceId! } },
        create: { userId: teacher.id, workspaceId: user.workspaceId!, role: 'tutor' },
        update: { role: 'tutor' },
      });
    } else {
      const name = (body.name || '').trim();
      const email = (body.email || '').trim().toLowerCase();
      if (!name || !email) {
        res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'Name and email are required.' });
        return;
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'User with this email already exists.' });
        return;
      }

      generatedPassword = body.password || `EX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const passwordHash = await bcrypt.hash(generatedPassword, 12);
      const usernameBase = email.split('@')[0];
      const username = `${usernameBase}_${Math.floor(100 + Math.random() * 900)}`;
      const userId = await generateFancyUserId('teacher');

      teacher = await prisma.user.create({
        data: {
          id: userId,
          name,
          email,
          username,
          role: 'teacher',
          workspaceId: user.workspaceId!,
          passwordHash,
          firstLogin: true,
          isActive: true,
          status: 'ACTIVE',
          mode: 'teacher',
        },
        select: { id: true, name: true, email: true, isActive: true, status: true },
      });

      await prisma.workspaceMembership.create({ data: { userId: teacher.id, workspaceId: user.workspaceId!, role: 'tutor' } });
    }

    const classIds = Array.isArray(body.classIds) ? body.classIds : [];
    if (classIds.length) {
      await prisma.classTeacher.createMany({
        data: classIds.map((cid) => ({ classId: cid, teacherId: teacher.id })),
        skipDuplicates: true,
      });
    }

    const subjectIds = Array.isArray(body.subjectIds) ? body.subjectIds : [];
    let linkedSubjects: { id: string; name: string }[] = [];
    if (subjectIds.length) {
      const validSubjects = await prisma.subject.findMany({
        where: { id: { in: subjectIds }, workspaceId: user.workspaceId! },
        select: { id: true, name: true },
      });
      if (validSubjects.length) {
        await prisma.teacherSubject.createMany({
          data: validSubjects.map((s) => ({ teacherId: teacher.id, subjectId: s.id })),
          skipDuplicates: true,
        });
        linkedSubjects = validSubjects;
      }
    }

    await prisma.schoolLog.create({ data: { actionType: 'teacher_created', entityId: teacher.id, role: user.role, userId: user.id } });

    // Prefer emailing the temporary credential over returning it in the API response.
    // The password only goes back to the caller as a fallback when mail isn't configured
    // or delivery fails, so it doesn't sit in plaintext in frontend state / network logs
    // by default.
    let credentialDelivery: 'email' | 'manual' = 'manual';
    if (generatedPassword && isMailConfigured()) {
      try {
        const workspace = await prisma.workspace.findUnique({ where: { id: user.workspaceId! }, select: { name: true } });
        await sendUserInvitationEmail({
          to: teacher.email,
          invitedRole: 'teacher',
          invitedByName: user.name,
          workspaceName: workspace?.name,
          temporaryPassword: generatedPassword,
        });
        credentialDelivery = 'email';
      } catch (mailError) {
        logger.error({ err: mailError }, 'Failed to send teacher invitation email, falling back to returning the password');
      }
    }

    res.status(201).json({
      success: true,
      data: {
        ...teacher,
        generatedPassword: credentialDelivery === 'manual' ? generatedPassword || undefined : undefined,
        credentialDelivery,
        subjects: linkedSubjects,
        classes: await prisma.class.findMany({ where: { id: { in: classIds } }, select: { id: true, name: true } }),
        assignmentsCreated: 0,
        examsCreated: 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

async function assertTeacherInWorkspace(teacherId: string, workspaceId: string, res: Response) {
  const teacher = await prisma.user.findFirst({ where: { id: teacherId, workspaceId, role: { in: ['teacher', 'tutor'] } } });
  if (!teacher) {
    res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Teacher not found.' });
    return null;
  }
  return teacher;
}

export const updateTeacherStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await loadPrincipal(req, res);
  if (!user) return;
  try {
    const teacherId = req.params.id as string;
    const teacher = await assertTeacherInWorkspace(teacherId, user.workspaceId!, res);
    if (!teacher) return;

    const nextActive = typeof req.body?.isActive === 'boolean' ? req.body.isActive : !teacher.isActive;
    const updated = await prisma.user.update({ where: { id: teacherId }, data: { isActive: nextActive, status: nextActive ? 'ACTIVE' : 'INACTIVE' } });
    await prisma.schoolLog.create({
      data: { actionType: nextActive ? 'teacher_activated' : 'teacher_deactivated', entityId: teacherId, role: user.role, userId: user.id },
    });

    res.json({ success: true, data: { id: teacherId, isActive: updated.isActive, status: updated.status } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTeacherProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await loadPrincipal(req, res);
  if (!user) return;
  try {
    const teacherId = req.params.id as string;
    const teacher = await assertTeacherInWorkspace(teacherId, user.workspaceId!, res);
    if (!teacher) return;

    const name = (req.body?.name || '').trim();
    const email = (req.body?.email || '').trim().toLowerCase();
    if (!name || !email) {
      res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'Name and email are required.' });
      return;
    }

    const updated = await prisma.user.update({ where: { id: teacherId }, data: { name, email } });
    await prisma.schoolLog.create({ data: { actionType: 'teacher_profile_updated', entityId: teacherId, role: user.role, userId: user.id } });

    res.json({ success: true, data: { id: teacherId, name: updated.name, email: updated.email } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignTeacherClassesSubjects = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await loadPrincipal(req, res);
  if (!user) return;
  try {
    const teacherId = req.params.id as string;
    const teacher = await assertTeacherInWorkspace(teacherId, user.workspaceId!, res);
    if (!teacher) return;

    const classIds: string[] = Array.isArray(req.body?.classIds) ? req.body.classIds : [];
    await prisma.classTeacher.deleteMany({ where: { teacherId, Class: { workspaceId: user.workspaceId! } } });
    if (classIds.length) {
      await prisma.classTeacher.createMany({ data: classIds.map((cid) => ({ classId: cid, teacherId })), skipDuplicates: true });
    }

    const subjectIds: string[] = Array.isArray(req.body?.subjectIds) ? req.body.subjectIds : [];
    await prisma.teacherSubject.deleteMany({ where: { teacherId, Subject: { workspaceId: user.workspaceId! } } });
    let updatedSubjects: { id: string; name: string }[] = [];
    if (subjectIds.length) {
      const validSubjects = await prisma.subject.findMany({ where: { id: { in: subjectIds }, workspaceId: user.workspaceId! }, select: { id: true, name: true } });
      if (validSubjects.length) {
        await prisma.teacherSubject.createMany({ data: validSubjects.map((s) => ({ teacherId, subjectId: s.id })), skipDuplicates: true });
        updatedSubjects = validSubjects;
      }
    }

    await prisma.schoolLog.create({ data: { actionType: 'teacher_classes_updated', entityId: teacherId, role: user.role, userId: user.id } });

    const updatedClasses = await prisma.class.findMany({ where: { id: { in: classIds } }, select: { id: true, name: true } });

    res.json({ success: true, data: { id: teacherId, classes: updatedClasses, subjects: updatedSubjects } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
