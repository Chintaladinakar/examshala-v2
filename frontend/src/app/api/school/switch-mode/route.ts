import { prisma } from '@/lib/prisma';
import { mapAuthzError, jsonError, jsonOk } from '@/lib/school/http';
import { requireSchoolAuth } from '@/lib/school/authz';

export async function POST() {
  try {
    const ctx = await requireSchoolAuth();
    if (ctx.role !== 'principal') return jsonError('FORBIDDEN', 'Only principals can switch mode', 403);

    const current = await prisma.user.findUnique({ where: { id: ctx.userId }, select: { mode: true, workspaceId: true } });
    const nextMode = (current?.mode || 'principal') === 'teacher' ? 'principal' : 'teacher';
    await prisma.user.update({ where: { id: ctx.userId }, data: { mode: nextMode } });

    const workspace = current?.workspaceId
      ? await prisma.workspace.findUnique({ where: { id: current.workspaceId }, select: { name: true } })
      : null;

    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { id: true, name: true, email: true, role: true, mode: true, workspaceId: true },
    });

    return jsonOk({
      id: user?.id,
      name: user?.name,
      email: user?.email,
      role: user?.role,
      mode: user?.mode ?? null,
      workspaceId: user?.workspaceId ?? null,
      workspaceName: workspace?.name ?? '',
    });
  } catch (err) {
    return mapAuthzError(err);
  }
}

