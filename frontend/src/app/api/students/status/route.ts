import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapAuthzError, jsonError, jsonOk } from '@/lib/school/http';
import { requirePrincipal, requireSchoolAuth } from '@/lib/school/authz';

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    requirePrincipal(ctx);

    const body = (await req.json()) as { studentId?: string; isActive?: boolean };
    if (!body.studentId || typeof body.isActive !== 'boolean') {
      return jsonError('BAD_REQUEST', 'studentId and isActive required', 400);
    }

    const student = await prisma.user.findFirst({
      where: { id: body.studentId, workspaceId: ctx.workspaceId, role: 'student' },
      select: { id: true },
    });
    if (!student) return jsonError('NOT_FOUND', 'Student not found', 404);

    const updated = await prisma.user.update({
      where: { id: student.id },
      data: { isActive: body.isActive },
      select: { id: true, isActive: true },
    });

    await prisma.schoolLog.create({
      data: { actionType: 'student_status_updated', entityId: updated.id, role: ctx.role, userId: ctx.userId },
    });

    return jsonOk(updated);
  } catch (err) {
    return mapAuthzError(err);
  }
}

