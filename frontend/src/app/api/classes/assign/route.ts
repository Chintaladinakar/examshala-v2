import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapAuthzError, jsonError, jsonOk } from '@/lib/school/http';
import { requirePrincipal, requireSchoolAuth } from '@/lib/school/authz';

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    requirePrincipal(ctx);

    const body = (await req.json()) as {
      classId?: string;
      studentIds?: string[];
      teacherIds?: string[];
    };
    if (!body.classId) return jsonError('BAD_REQUEST', 'classId required', 400);

    const klass = await prisma.class.findFirst({ where: { id: body.classId, workspaceId: ctx.workspaceId } });
    if (!klass) return jsonError('NOT_FOUND', 'Class not found', 404);

    const studentIds = Array.isArray(body.studentIds) ? body.studentIds : [];
    const teacherIds = Array.isArray(body.teacherIds) ? body.teacherIds : [];

    if (studentIds.length) {
      const validStudents = await prisma.user.findMany({
        where: { id: { in: studentIds }, workspaceId: ctx.workspaceId, role: 'student' },
        select: { id: true },
      });
      await prisma.classStudent.deleteMany({ where: { classId: klass.id } });
      await prisma.classStudent.createMany({
        data: validStudents.map(s => ({ classId: klass.id, studentId: s.id })),
        skipDuplicates: true,
      });
    }

    if (teacherIds.length) {
      const validTeachers = await prisma.user.findMany({
        where: { id: { in: teacherIds }, workspaceId: ctx.workspaceId, role: 'teacher' },
        select: { id: true },
      });
      await prisma.classTeacher.deleteMany({ where: { classId: klass.id } });
      await prisma.classTeacher.createMany({
        data: validTeachers.map(t => ({ classId: klass.id, teacherId: t.id })),
        skipDuplicates: true,
      });
    }

    await prisma.schoolLog.create({
      data: { actionType: 'class_assignments_updated', entityId: klass.id, role: ctx.role, userId: ctx.userId },
    });

    return jsonOk({ classId: klass.id });
  } catch (err) {
    return mapAuthzError(err);
  }
}

