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

    // Fetch all workspaces where the user has a membership
    const memberships = await prisma.workspaceMembership.findMany({
      where: { userId: ctx.userId },
      include: {
        Workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const workspaces = memberships.map((m) => ({
      id: m.Workspace.id,
      name: m.Workspace.name,
      role: m.role,
    }));

    return jsonOk({
      id: user?.id,
      name: user?.name,
      email: user?.email,
      role: user?.role,
      mode: ctx.mode,
      workspaceId: user?.workspaceId ?? null,
      workspaceName: workspace?.name ?? '',
      workspaces: workspaces,
    });
  } catch (err) {
    return mapAuthzError(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = await requireSchoolAuth();
    const body = await req.json();
    const name = (body.name || '').trim();

    if (!name) {
      return Response.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Name is required' } },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: ctx.userId },
      data: { name },
      select: { id: true, name: true, email: true, role: true, mode: true, workspaceId: true },
    });

    return jsonOk(updated);
  } catch (err) {
    return mapAuthzError(err);
  }
}

