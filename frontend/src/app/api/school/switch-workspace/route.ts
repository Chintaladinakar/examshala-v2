import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { mapAuthzError, jsonError, jsonOk } from '@/lib/school/http';
import { requireSchoolAuth } from '@/lib/school/authz';

function signJwt(payload: any, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  
  const base64Url = (str: string) => 
    Buffer.from(str)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
      
  const unsignedToken = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(unsignedToken)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
    
  return `${unsignedToken}.${signature}`;
}

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
    
    const currentUser = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { role: true, mode: true },
    });

    if (!currentUser) {
      return jsonError('UNAUTHORIZED', 'Unauthorized', 401);
    }

    const currentRole = (currentUser.role || '').toLowerCase();
    const isGlobalAdmin = currentRole === 'org_admin';

    const membershipRole = membership.role.toLowerCase();
    const targetRole = isGlobalAdmin ? currentUser.role : membershipRole.toUpperCase();
    const targetMode = isGlobalAdmin
      ? (currentUser.mode || 'principal')
      : (membershipRole === 'teacher' || membershipRole === 'tutor' ? 'teacher' : 'principal');

    // 2. Update the active workspace without downgrading global admins into workspace roles
    await prisma.user.update({
      where: { id: ctx.userId },
      data: {
        workspaceId: workspaceId,
        role: targetRole,
        mode: targetMode,
      },
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

    // 6. Generate and set a new JWT token to update user's session cookie
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return jsonError('SERVER_ERROR', 'Server misconfiguration', 500);
    }
    const payload = {
      userId: ctx.userId,
      role: targetRole,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    };
    const token = signJwt(payload, jwtSecret);

    (await cookies()).set('session_token', token, {
      path: '/',
      maxAge: 86400,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    
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
