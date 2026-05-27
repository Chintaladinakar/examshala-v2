import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapAuthzError, jsonError, jsonOk } from '@/lib/school/http';
import { requirePrincipal, requireSchoolAuth } from '@/lib/school/authz';

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    requirePrincipal(ctx);

    const body = (await req.json()) as { teacherId?: string; classIds?: string[] };
    if (!body.teacherId || !Array.isArray(body.classIds)) {
      return jsonError('BAD_REQUEST', 'teacherId and classIds required', 400);
    }

    const teacher = await prisma.user.findFirst({
      where: { id: body.teacherId, workspaceId: ctx.workspaceId, role: 'teacher' },
      select: { id: true },
    });
    if (!teacher) return jsonError('NOT_FOUND', 'Teacher not found', 404);

    const classes = await prisma.class.findMany({ where: { id: { in: body.classIds }, workspaceId: ctx.workspaceId } });
    await prisma.classTeacher.deleteMany({ where: { teacherId: teacher.id, Class: { workspaceId: ctx.workspaceId } } });
    await prisma.classTeacher.createMany({
      data: classes.map((c: any) => ({ classId: c.id, teacherId: teacher.id })),
      skipDuplicates: true,
    });

    await prisma.schoolLog.create({
      data: { actionType: 'teacher_classes_updated', entityId: teacher.id, role: ctx.role, userId: ctx.userId },
    });

    return jsonOk({ teacherId: teacher.id, classIds: classes.map((c: any) => c.id) });
  } catch (err) {
    return mapAuthzError(err);
  }
}

