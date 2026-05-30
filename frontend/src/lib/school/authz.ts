import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

type JwtPayload = {
  userId?: string;
  role?: string;
};

function decodeJwtPayloadNode(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export type SchoolMode = 'principal' | 'teacher';

export type AuthContext = {
  userId: string;
  role: string;
  mode: SchoolMode;
  workspaceId: string;
};

export async function requireSchoolAuth(): Promise<AuthContext> {
  const token = (await cookies()).get('session_token')?.value;
  if (!token) throw new Error('UNAUTHORIZED');

  const decoded = decodeJwtPayloadNode(token);
  const userId = decoded?.userId;
  if (!userId) throw new Error('UNAUTHORIZED');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, mode: true, workspaceId: true, isActive: true },
  });

  if (!user || !user.isActive) throw new Error('UNAUTHORIZED');

  let workspaceId = user.workspaceId;
  if (!workspaceId) {
    const firstWorkspace = await prisma.workspace.findFirst({ select: { id: true } });
    if (firstWorkspace) {
      workspaceId = firstWorkspace.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { workspaceId: firstWorkspace.id },
      });
    } else {
      throw new Error('NO_WORKSPACE');
    }
  }

  const role = (user.role || decoded?.role || '').toLowerCase();
  const rawMode = (user.mode || 'principal').toLowerCase();
  const mode: SchoolMode = (role === 'teacher' || role === 'tutor') ? 'teacher' : (rawMode === 'teacher' ? 'teacher' : 'principal');

  return { userId: user.id, role, mode, workspaceId };
}

export function requirePrincipal(ctx: AuthContext) {
  if (ctx.role !== 'principal') throw new Error('FORBIDDEN');
  if (ctx.mode !== 'principal') throw new Error('FORBIDDEN');
}

export function requireTeacherOrPrincipal(ctx: AuthContext) {
  const isTeacher = ctx.role === 'teacher' || ctx.role === 'tutor' || (ctx.role === 'principal' && ctx.mode === 'teacher');
  const isPrincipal = ctx.role === 'principal' && ctx.mode === 'principal';
  if (!isTeacher && !isPrincipal) throw new Error('FORBIDDEN');
  return { isTeacher, isPrincipal };
}

