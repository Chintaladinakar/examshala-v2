import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSchoolAuth } from '@/lib/school/authz';
import { jsonOk, jsonError, mapAuthzError } from '@/lib/school/http';

export async function GET() {
  try {
    const ctx = await requireSchoolAuth();
    if (ctx.role !== 'superadmin' && ctx.role !== 'org_admin' && ctx.role !== 'admin') {
      return jsonError('FORBIDDEN', 'Only Admins can access this resource.', 403);
    }

    const invites = await prisma.invite.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const data = await Promise.all(
      invites.map(async (inv: any) => {
        let workspaceName = 'Global / System';
        if (inv.workspaceId) {
          const ws = await prisma.workspace.findUnique({
            where: { id: inv.workspaceId },
            select: { name: true },
          });
          if (ws) {
            workspaceName = ws.name;
          }
        }

        // We check if the status is PENDING and exceeds 7 days, we can mark it as EXPIRED for visuals!
        let computedStatus = inv.status || 'PENDING';
        if (computedStatus === 'PENDING') {
          const diffTime = Math.abs(new Date().getTime() - new Date(inv.createdAt).getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > 7) {
            computedStatus = 'EXPIRED';
          }
        }

        return {
          id: inv.id,
          workspace: workspaceName,
          invitedUser: inv.email.split('@')[0], // username fallback
          email: inv.email,
          role: inv.role.toUpperCase(),
          status: computedStatus,
          sentDate: inv.createdAt,
        };
      })
    );

    return jsonOk(data);
  } catch (err) {
    return mapAuthzError(err);
  }
}
