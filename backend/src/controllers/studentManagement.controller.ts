import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import { isMailConfigured, sendUserInvitationEmail } from '../services/mail.service';
import logger from '../lib/logger';

async function loadTeacherOrPrincipal(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.workspaceId) {
    res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
    return null;
  }
  const role = user.role.toLowerCase();
  if (role !== 'teacher' && role !== 'principal') {
    res.status(403).json({ success: false, code: 'ACCESS_DENIED', message: 'Only teachers and principals can manage students.' });
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

export const listStudentsDetailed = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await loadTeacherOrPrincipal(req, res);
  if (!user) return;
  try {
    const students = await prisma.user.findMany({
      where: { workspaceId: user.workspaceId!, role: 'student' },
      select: { id: true, username: true, name: true, email: true, isActive: true, status: true },
      orderBy: { createdAt: 'desc' },
    });

    const classLinks = await prisma.classStudent.findMany({
      where: { Class: { workspaceId: user.workspaceId! } },
      select: { studentId: true, Class: { select: { id: true, name: true } } },
    });
    const classByStudent = new Map<string, { id: string; name: string }>();
    for (const link of classLinks) classByStudent.set(link.studentId, link.Class);

    res.json({ success: true, data: students.map((s) => ({ ...s, class: classByStudent.get(s.id) ?? null })) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createOrAssociateStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await loadTeacherOrPrincipal(req, res);
  if (!user) return;
  try {
    const body = req.body as {
      mode?: 'associate' | 'create';
      uniqueId?: string;
      name?: string;
      email?: string;
      password?: string;
      classId?: string;
    };
    const mode = body.mode || 'create';

    let student: { id: string; username: string | null; name: string; email: string; isActive: boolean; status: string };
    let generatedPassword = '';

    if (mode === 'associate') {
      const uniqueId = (body.uniqueId || '').trim();
      if (!uniqueId) {
        res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'Unique ID/Email/Username is required for association.' });
        return;
      }

      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ id: uniqueId }, { email: uniqueId.toLowerCase() }, { username: uniqueId }], role: 'student' },
      });
      if (!existingUser) {
        res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'No student account found with the provided identifier.' });
        return;
      }

      student = await prisma.user.update({
        where: { id: existingUser.id },
        data: { workspaceId: user.workspaceId! },
        select: { id: true, username: true, name: true, email: true, isActive: true, status: true },
      });

      await prisma.workspaceMembership.upsert({
        where: { userId_workspaceId: { userId: student.id, workspaceId: user.workspaceId! } },
        create: { userId: student.id, workspaceId: user.workspaceId!, role: 'student' },
        update: { role: 'student' },
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
      const userId = await generateFancyUserId('student');

      student = await prisma.user.create({
        data: {
          id: userId,
          name,
          email,
          username,
          role: 'student',
          workspaceId: user.workspaceId!,
          passwordHash,
          firstLogin: true,
          isActive: true,
          status: 'ACTIVE',
          mode: 'student',
        },
        select: { id: true, username: true, name: true, email: true, isActive: true, status: true },
      });

      await prisma.workspaceMembership.create({ data: { userId: student.id, workspaceId: user.workspaceId!, role: 'student' } });
    }

    if (body.classId) {
      const klass = await prisma.class.findFirst({ where: { id: body.classId, workspaceId: user.workspaceId! } });
      if (klass) {
        await prisma.classStudent.upsert({
          where: { classId_studentId: { classId: klass.id, studentId: student.id } },
          create: { classId: klass.id, studentId: student.id },
          update: {},
        });
      }
    }

    await prisma.schoolLog.create({ data: { actionType: 'student_created', entityId: student.id, role: user.role, userId: user.id } });

    let credentialDelivery: 'email' | 'manual' = 'manual';
    if (generatedPassword && isMailConfigured()) {
      try {
        const workspace = await prisma.workspace.findUnique({ where: { id: user.workspaceId! }, select: { name: true } });
        await sendUserInvitationEmail({
          to: student.email,
          invitedRole: 'student',
          invitedByName: user.name,
          workspaceName: workspace?.name,
          temporaryPassword: generatedPassword,
        });
        credentialDelivery = 'email';
      } catch (mailError) {
        logger.error({ err: mailError }, 'Failed to send student invitation email, falling back to returning the password');
      }
    }

    res.status(201).json({
      success: true,
      data: {
        ...student,
        generatedPassword: credentialDelivery === 'manual' ? generatedPassword || undefined : undefined,
        credentialDelivery,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
