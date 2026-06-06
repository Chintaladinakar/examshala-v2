import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { mapAuthzError, jsonError, jsonOk } from '@/lib/school/http';
import { requireSchoolAuth, requireTeacherOrPrincipal } from '@/lib/school/authz';

export async function GET() {
  try {
    const ctx = await requireSchoolAuth();
    requireTeacherOrPrincipal(ctx);

    const students = await prisma.user.findMany({
      where: { workspaceId: ctx.workspaceId, role: 'student' },
      select: { id: true, username: true, name: true, email: true, isActive: true, status: true },
      orderBy: { createdAt: 'desc' },
    });

    const classLinks = await prisma.classStudent.findMany({
      where: { Class: { workspaceId: ctx.workspaceId } },
      select: { studentId: true, Class: { select: { id: true, name: true } } },
    });

    const classByStudent = new Map<string, { id: string; name: string }>();
    for (const link of classLinks) classByStudent.set(link.studentId, link.Class);

    return jsonOk(
      students.map((s: any) => ({
        ...s,
        class: classByStudent.get(s.id) ?? null,
      }))
    );
  } catch (err) {
    return mapAuthzError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    requireTeacherOrPrincipal(ctx);

    const body = (await req.json()) as {
      mode?: 'associate' | 'create';
      uniqueId?: string;
      name?: string;
      email?: string;
      password?: string;
      classId?: string;
    };

    const mode = body.mode || 'create';

    let student;
    let generatedPassword = '';

    if (mode === 'associate') {
      const uniqueId = (body.uniqueId || '').trim();
      if (!uniqueId) {
        return jsonError('BAD_REQUEST', 'Unique ID/Email/Username is required for association', 400);
      }

      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: uniqueId },
            { email: uniqueId.toLowerCase() },
            { username: uniqueId },
          ],
          role: 'student',
        },
      });

      if (!existingUser) {
        return jsonError('NOT_FOUND', 'No student account found with the provided identifier', 404);
      }

      // Update workspace association
      student = await prisma.user.update({
        where: { id: existingUser.id },
        data: { workspaceId: ctx.workspaceId },
        select: { id: true, username: true, name: true, email: true, isActive: true, status: true },
      });

      // Upsert workspace membership
      await prisma.workspaceMembership.upsert({
        where: { userId_workspaceId: { userId: student.id, workspaceId: ctx.workspaceId } },
        create: { userId: student.id, workspaceId: ctx.workspaceId, role: 'student' },
        update: { role: 'student' },
      });
    } else {
      const name = (body.name || '').trim();
      const email = (body.email || '').trim().toLowerCase();

      if (!name || !email) {
        return jsonError('BAD_REQUEST', 'Name and email are required', 400);
      }

      // Check if email already registered
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return jsonError('BAD_REQUEST', 'User with this email already exists', 400);
      }

      generatedPassword = body.password || `EX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const passwordHash = await bcrypt.hash(generatedPassword, 12);

      // Generate a username based on email prefix
      const usernameBase = email.split('@')[0];
      const username = `${usernameBase}_${Math.floor(100 + Math.random() * 900)}`;

      /**
       * Generates a unique, short, and brand-consistent 8-character User ID.
       * Combines a role-specific prefix (e.g. TR- for teachers, ST- for students)
       * with a random 5-character alphanumeric block for maximum user readability and privacy.
       */
      const generateFancyUserId = async (role: string): Promise<string> => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let prefix = 'US-';
        const roleLower = role.toLowerCase();
        if (roleLower === 'student') prefix = 'ST-';
        else if (roleLower === 'tutor' || roleLower === 'teacher') prefix = 'TR-';
        else if (roleLower === 'principal') prefix = 'PR-';
        else if (roleLower === 'org_admin') prefix = 'AD-';

        let attempts = 0;
        while (attempts < 50) {
          let code = prefix;
          for (let i = 0; i < 5; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          const existing = await prisma.user.findUnique({ where: { id: code } });
          if (!existing) return code;
          attempts++;
        }
        return `${prefix}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      };
      const userId = await generateFancyUserId('student');

      student = await prisma.user.create({
        data: {
          id: userId,
          name,
          email,
          username,
          role: 'student',
          workspaceId: ctx.workspaceId,
          passwordHash,
          firstLogin: true,
          isActive: true,
          status: 'ACTIVE',
        },
        select: { id: true, username: true, name: true, email: true, isActive: true, status: true },
      });

      // Create workspace membership
      await prisma.workspaceMembership.create({
        data: { userId: student.id, workspaceId: ctx.workspaceId, role: 'student' },
      });
    }

    // Link class
    if (body.classId) {
      const klass = await prisma.class.findFirst({ where: { id: body.classId, workspaceId: ctx.workspaceId } });
      if (klass) {
        await prisma.classStudent.upsert({
          where: { classId_studentId: { classId: klass.id, studentId: student.id } },
          create: { classId: klass.id, studentId: student.id },
          update: {},
        });
      }
    }

    await prisma.schoolLog.create({
      data: { actionType: 'student_created', entityId: student.id, role: ctx.role, userId: ctx.userId },
    });

    return jsonOk({
      ...student,
      generatedPassword: generatedPassword || undefined,
    }, { status: 201 });

  } catch (err) {
    return mapAuthzError(err);
  }
}

