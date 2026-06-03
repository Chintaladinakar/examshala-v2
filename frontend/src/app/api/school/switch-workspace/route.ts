import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapAuthzError, jsonError, jsonOk } from '@/lib/school/http';
import { requireSchoolAuth } from '@/lib/school/authz';

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    
    // Parse request body safely
    const body = await req.json().catch(() => ({}));
    const { workspaceId } = body;
    
    if (!workspaceId) {
      return jsonError('BAD_REQUEST', 'workspaceId is required', 400);
    }
    
    // 1. Verify that the user has a membership in the requested workspace
    const membership = await prisma.workspaceMembership.findUnique({
      where: {
        userId_workspaceId: {
          userId: ctx.userId,
          workspaceId: workspaceId,
        },
      },
    });
    
    if (!membership) {
      return jsonError('FORBIDDEN', 'You do not have access to this workspace', 403);
    }
    
    // 2. Update the user's active workspaceId in the User database model
    await prisma.user.update({
      where: { id: ctx.userId },
      data: { workspaceId: workspaceId },
    });
    
    // 3. Fetch the new active workspace details
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true },
    });
    
    // 4. Fetch the full user details
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { id: true, name: true, email: true, role: true, mode: true, workspaceId: true },
    });
    
    // 5. Fetch all memberships to return updated list of all workspaces
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
      mode: user?.mode ?? null,
      workspaceId: user?.workspaceId ?? null,
      workspaceName: workspace?.name ?? '',
      workspaces: workspaces,
    });
  } catch (err) {
    return mapAuthzError(err);
  }
}
