import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapAuthzError, jsonError, jsonOk } from '@/lib/school/http';
import { requirePrincipal, requireSchoolAuth } from '@/lib/school/authz';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireSchoolAuth();
    requirePrincipal(ctx);

    const { id } = await context.params;
    const body = (await req.json()) as { comment?: string };
    const comment = (body.comment || '').trim();
    if (!comment) return jsonError('BAD_REQUEST', 'comment required', 400);

    const assignment = await prisma.assignment.findFirst({
      where: { id, Class: { workspaceId: ctx.workspaceId } },
      select: { id: true },
    });
    if (!assignment) return jsonError('NOT_FOUND', 'Assignment not found', 404);

    const feedback = await prisma.assignmentFeedback.create({
      data: { assignmentId: assignment.id, comment, createdByUserId: ctx.userId },
      select: { id: true, comment: true, createdAt: true },
    });

    await prisma.schoolLog.create({
      data: { actionType: 'feedback_added', entityId: feedback.id, role: ctx.role, userId: ctx.userId },
    });

    return jsonOk(feedback, { status: 201 });
  } catch (err) {
    return mapAuthzError(err);
  }
}
