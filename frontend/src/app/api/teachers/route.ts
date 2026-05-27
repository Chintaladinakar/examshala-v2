import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapAuthzError, jsonError, jsonOk } from '@/lib/school/http';
import { requirePrincipal, requireSchoolAuth } from '@/lib/school/authz';

export async function GET() {
  try {
    const ctx = await requireSchoolAuth();
    requirePrincipal(ctx);

    const teachers = await prisma.user.findMany({
      where: { workspaceId: ctx.workspaceId, role: 'teacher' },
      select: { id: true, name: true, email: true, isActive: true, status: true },
      orderBy: { createdAt: 'desc' },
    });

    const classLinks = await prisma.classTeacher.findMany({
      where: { Class: { workspaceId: ctx.workspaceId } },
      select: { teacherId: true, Class: { select: { id: true, name: true } } },
    });

    const classesByTeacher = new Map<string, { id: string; name: string }[]>();
    for (const link of classLinks) {
      const list = classesByTeacher.get(link.teacherId) ?? [];
      list.push(link.Class);
      classesByTeacher.set(link.teacherId, list);
    }

    return jsonOk(
      teachers.map((t: any) => ({
        ...t,
        classes: classesByTeacher.get(t.id) ?? [],
      }))
    );
  } catch (err) {
    return mapAuthzError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    requirePrincipal(ctx);

    const body = (await req.json()) as { name?: string; email?: string; password?: string; classIds?: string[] };
    const name = (body.name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    if (!name || !email) return jsonError('BAD_REQUEST', 'name and email required', 400);

    const teacher = await prisma.user.create({
      data: {
        name,
        email,
        role: 'teacher',
        workspaceId: ctx.workspaceId,
        passwordHash: body.password ? body.password : null,
        isActive: true,
        status: 'ACTIVE',
        mode: 'teacher',
      },
      select: { id: true, name: true, email: true, isActive: true, status: true },
    });

    const classIds = Array.isArray(body.classIds) ? body.classIds : [];
    if (classIds.length) {
      const classes = await prisma.class.findMany({ where: { id: { in: classIds }, workspaceId: ctx.workspaceId } });
      await prisma.classTeacher.createMany({
        data: classes.map((c: any) => ({ classId: c.id, teacherId: teacher.id })),
        skipDuplicates: true,
      });
    }

    await prisma.schoolLog.create({
      data: { actionType: 'teacher_created', entityId: teacher.id, role: ctx.role, userId: ctx.userId },
    });

    return jsonOk(teacher, { status: 201 });
  } catch (err) {
    return mapAuthzError(err);
  }
}

