import { prisma } from '@/lib/prisma';
import { mapAuthzError, jsonOk } from '@/lib/school/http';
import { requireSchoolAuth } from '@/lib/school/authz';

export async function GET() {
  try {
    const ctx = await requireSchoolAuth();
    const workspace = await prisma.workspace.findUnique({ where: { id: ctx.workspaceId }, select: { name: true } });
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

