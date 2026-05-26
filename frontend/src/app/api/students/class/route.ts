import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapAuthzError, jsonError, jsonOk } from '@/lib/school/http';
import { requirePrincipal, requireSchoolAuth } from '@/lib/school/authz';

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    requirePrincipal(ctx);

    const body = (await req.json()) as { studentId?: string; classId?: string | null };
    if (!body.studentId) return jsonError('BAD_REQUEST', 'studentId required', 400);

    const student = await prisma.user.findFirst({
      where: { id: body.studentId, workspaceId: ctx.workspaceId, role: 'student' },
      select: { id: true },
    });
    if (!student) return jsonError('NOT_FOUND', 'Student not found', 404);

    await prisma.classStudent.deleteMany({
      where: { studentId: student.id, Class: { workspaceId: ctx.workspaceId } },
    });

    if (body.classId) {
      const klass = await prisma.class.findFirst({ where: { id: body.classId, workspaceId: ctx.workspaceId } });
      if (!klass) return jsonError('NOT_FOUND', 'Class not found', 404);
      await prisma.classStudent.create({ data: { classId: klass.id, studentId: student.id } });
    }

    await prisma.schoolLog.create({
      data: { actionType: 'student_class_assigned', entityId: student.id, role: ctx.role, userId: ctx.userId },
    });

    return jsonOk({ studentId: student.id, classId: body.classId ?? null });
  } catch (err) {
    return mapAuthzError(err);
  }
}

