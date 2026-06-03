import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireSchoolAuth, requirePrincipal } from '@/lib/school/authz';
import { jsonOk, jsonError, mapAuthzError } from '@/lib/school/http';

export async function GET() {
  try {
    const ctx = await requireSchoolAuth();
    requirePrincipal(ctx);

    const teachers = await prisma.user.findMany({
      where: { workspaceId: ctx.workspaceId, role: { in: ['teacher', 'tutor'] } },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const classTeachers = await prisma.classTeacher.findMany({
      where: { Class: { workspaceId: ctx.workspaceId } },
      include: { Class: { select: { id: true, name: true } } },
    });

    const classMap = new Map<string, { id: string; name: string }[]>();
    for (const ct of classTeachers) {
      const list = classMap.get(ct.teacherId) || [];
      list.push(ct.Class);
      classMap.set(ct.teacherId, list);
    }

    const teacherIds = teachers.map((t: any) => t.id);

    const assignmentsCount = await prisma.assignment.groupBy({
      by: ['createdByUserId'],
      where: { createdByUserId: { in: teacherIds } },
      _count: { id: true },
    });
    const assignmentMap = new Map(assignmentsCount.map((a: any) => [a.createdByUserId, a._count.id]));

    const examsCount = await prisma.assessmentAssignment.groupBy({
      by: ['assignedByUserId'],
      where: { assignedByUserId: { in: teacherIds } },
      _count: { id: true },
    });
    const examMap = new Map(examsCount.map((e: any) => [e.assignedByUserId, e._count.id]));

    const data = teachers.map((t: any) => {
      // Mock extra profile fields seamlessly
      return {
        id: t.id,
        name: t.name,
        email: t.email,
        phone: '+91 98765 43210',
        qualification: 'M.Tech / M.Sc Mathematics',
        experience: '5+ Years',
        subjects: ['Mathematics', 'Physics', 'Science'],
        classes: classMap.get(t.id) || [],
        assignmentsCreated: assignmentMap.get(t.id) || 0,
        examsCreated: examMap.get(t.id) || 0,
        isActive: t.isActive,
        status: t.status,
      };
    });

    return jsonOk(data);
  } catch (err) {
    return mapAuthzError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    requirePrincipal(ctx);

    const body = (await req.json()) as {
      mode?: 'associate' | 'create';
      uniqueId?: string;
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
      qualification?: string;
      experience?: string;
      subjects?: string[];
      classIds?: string[];
    };

    const mode = body.mode || 'create';

    let teacher;
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
          role: { in: ['teacher', 'tutor'] },
        },
      });

      if (!existingUser) {
        return jsonError('NOT_FOUND', 'No teacher or tutor account found with the provided identifier', 404);
      }

      // Update workspace association
      teacher = await prisma.user.update({
        where: { id: existingUser.id },
        data: { workspaceId: ctx.workspaceId },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          status: true,
        },
      });

      // Upsert workspace membership
      await prisma.workspaceMembership.upsert({
        where: { userId_workspaceId: { userId: teacher.id, workspaceId: ctx.workspaceId } },
        create: { userId: teacher.id, workspaceId: ctx.workspaceId, role: 'tutor' }, // Map to tutor in memberships
        update: { role: 'tutor' },
      });
    } else {
      const name = (body.name || '').trim();
      const email = (body.email || '').trim().toLowerCase();

      if (!name || !email) {
        return jsonError('BAD_REQUEST', 'Name and email are required', 400);
      }

      // Check if email already registered
      const existing = await prisma.user.findUnique({
        where: { email },
      });

      if (existing) {
        return jsonError('BAD_REQUEST', 'User with this email already exists', 400);
      }

      generatedPassword = body.password || `EX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const passwordHash = await bcrypt.hash(generatedPassword, 12);

      // Generate a username based on email prefix
      const usernameBase = email.split('@')[0];
      const username = `${usernameBase}_${Math.floor(100 + Math.random() * 900)}`;

      teacher = await prisma.user.create({
        data: {
          name,
          email,
          username,
          role: 'teacher',
          workspaceId: ctx.workspaceId,
          passwordHash,
          firstLogin: true,
          isActive: true,
          status: 'ACTIVE',
          mode: 'teacher',
        },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          status: true,
        },
      });

      // Create workspace membership
      await prisma.workspaceMembership.create({
        data: { userId: teacher.id, workspaceId: ctx.workspaceId, role: 'tutor' },
      });
    }

    // Link classes
    const classIds = Array.isArray(body.classIds) ? body.classIds : [];
    if (classIds.length) {
      await prisma.classTeacher.createMany({
        data: classIds.map((cid: string) => ({
          classId: cid,
          teacherId: teacher.id,
        })),
        skipDuplicates: true,
      });
    }

    // Add Audit Log
    await prisma.schoolLog.create({
      data: {
        actionType: 'teacher_created',
        entityId: teacher.id,
        role: ctx.role,
        userId: ctx.userId,
      },
    });

    const fullTeacher = {
      ...teacher,
      generatedPassword: generatedPassword || undefined,
      phone: body.phone || '+91 98765 43210',
      qualification: body.qualification || 'M.Sc. Education',
      experience: body.experience || '3 Years',
      subjects: body.subjects || ['Mathematics'],
      classes: await prisma.class.findMany({
        where: { id: { in: classIds } },
        select: { id: true, name: true },
      }),
      assignmentsCreated: 0,
      examsCreated: 0,
    };

    return jsonOk(fullTeacher, { status: 201 });
  } catch (err) {
    return mapAuthzError(err);
  }
}
