import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapAuthzError, jsonError, jsonOk } from '@/lib/school/http';
import { requirePrincipal, requireSchoolAuth } from '@/lib/school/authz';

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    requirePrincipal(ctx);

    const body = (await req.json()) as { teacherId?: string; isActive?: boolean };
    if (!body.teacherId || typeof body.isActive !== 'boolean') {
      return jsonError('BAD_REQUEST', 'teacherId and isActive required', 400);
    }

    const teacher = await prisma.user.findFirst({
      where: { id: body.teacherId, workspaceId: ctx.workspaceId, role: 'teacher' },
      select: { id: true },
    });
    if (!teacher) return jsonError('NOT_FOUND', 'Teacher not found', 404);

    const updated = await prisma.user.update({
      where: { id: teacher.id },
      data: { isActive: body.isActive },
      select: { id: true, isActive: true },
    });

    await prisma.schoolLog.create({
      data: { actionType: 'teacher_status_updated', entityId: updated.id, role: ctx.role, userId: ctx.userId },
    });

    return jsonOk(updated);
  } catch (err) {
    return mapAuthzError(err);
  }
}

