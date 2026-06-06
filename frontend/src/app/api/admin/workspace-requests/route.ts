import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSchoolAuth } from '@/lib/school/authz';
import { jsonOk, jsonError, mapAuthzError } from '@/lib/school/http';

export async function GET() {
  try {
    const ctx = await requireSchoolAuth();
    if (ctx.role !== 'org_admin') {
      return jsonError('FORBIDDEN', 'Only Admins can access this resource.', 403);
    }

    // Fetch all pending or rejected workspace requests
    const workspaces = await prisma.workspace.findMany({
      where: {
        status: { in: ['PENDING', 'REJECTED'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = workspaces.map((w: any) => {
      let meta: any = {};
      try {
        if (w.createdBy && w.createdBy.startsWith('JSON_REQ:')) {
          meta = JSON.parse(w.createdBy.replace('JSON_REQ:', ''));
        }
      } catch {}

      return {
        id: w.id,
        name: w.name,
        status: w.status || 'PENDING',
        createdAt: w.createdAt,
        requesterId: meta.requesterId || 'Unknown User',
        institutionType: meta.institutionType || 'Tuition Center',
        description: meta.description || '',
        contactName: meta.contactName || 'Applicant Name',
        phone: meta.phone || 'Phone Number',
        email: meta.email || 'Email Address',
        studentsCount: meta.studentsCount || '1-50',
        teachersCount: meta.teachersCount || '1-50',
        academicType: meta.academicType || 'Offline',
        country: meta.country || 'India',
        state: meta.state || '',
        city: meta.city || '',
        address: meta.address || '',
        website: meta.website || '',
        socialLinks: meta.socialLinks || {},
        rejectionReason: meta.rejectionReason || '',
      };
    });

    return jsonOk(data);
  } catch (err) {
    return mapAuthzError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    if (ctx.role !== 'org_admin') {
      return jsonError('FORBIDDEN', 'Only Admins can review workspace requests.', 403);
    }

    const body = (await req.json()) as {
      workspaceId: string;
      action: 'approve' | 'reject';
      rejectionReason?: string;
    };

    const { workspaceId, action } = body;
    if (!workspaceId) return jsonError('BAD_REQUEST', 'workspaceId is required.');

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) return jsonError('NOT_FOUND', 'Workspace request not found.');

    let meta: any = {};
    try {
      if (workspace.createdBy && workspace.createdBy.startsWith('JSON_REQ:')) {
        meta = JSON.parse(workspace.createdBy.replace('JSON_REQ:', ''));
      }
    } catch {}

    const requesterId = meta.requesterId;
    if (!requesterId) return jsonError('BAD_REQUEST', 'Requester metadata not found.');

    if (action === 'approve') {
      // 1. Generate unique workspace join code
      // Format: EXM-AAA-9999
      const randomLetters = Array.from({ length: 3 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const generatedCode = `EXM-${randomLetters}-${randomDigits}`;

      // Update meta block with code
      meta.code = generatedCode;
      meta.approvedAt = new Date();

      // 2. Set Workspace active status and assign code
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          status: 'ACTIVE',
          principalId: requesterId,
          createdBy: `JSON_REQ:${JSON.stringify(meta)}`, // save updated metadata
        },
      });

      // 3. Elevate user role to principal and set active workspace
      await prisma.user.update({
        where: { id: requesterId },
        data: {
          role: 'principal',
          mode: 'principal',
          workspaceId: workspaceId,
        },
      });

      // 4. Create Workspace Membership
      await prisma.workspaceMembership.upsert({
        where: {
          userId_workspaceId: {
            userId: requesterId,
            workspaceId: workspaceId,
          },
        },
        create: {
          userId: requesterId,
          workspaceId: workspaceId,
          role: 'principal',
        },
        update: {
          role: 'principal',
        },
      });

      // 5. Initialize settings
      await prisma.platformSettings.upsert({
        where: { id: 'global-settings' },
        create: { platformName: 'EDUsphere Academy', supportEmail: 'support@edusphere.com' },
        update: {},
      });

      // 6. Create Audit Log
      await prisma.schoolLog.create({
        data: {
          actionType: 'workspace_approved',
          entityId: workspaceId,
          role: ctx.role,
          userId: ctx.userId,
        },
      });

      // 7. Dispatch notifications for the requester
      await prisma.notification.create({
        data: {
          userId: requesterId,
          workspaceId: workspaceId,
          type: 'workspace_approved',
          title: 'Workspace Request Approved!',
          message: `Congratulations! Institution "${workspace.name}" has been approved. Generate join codes: ${generatedCode}.`,
          isRead: false,
        },
      });

      return jsonOk({ success: true, status: 'ACTIVE', code: generatedCode });
    }

    if (action === 'reject') {
      const reason = body.rejectionReason || 'Incomplete institution information.';

      meta.rejectionReason = reason;
      meta.rejectedAt = new Date();

      // Update Workspace status to REJECTED
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          status: 'REJECTED',
          createdBy: `JSON_REQ:${JSON.stringify(meta)}`,
        },
      });

      await prisma.schoolLog.create({
        data: {
          actionType: 'workspace_rejected',
          entityId: workspaceId,
          role: ctx.role,
          userId: ctx.userId,
        },
      });

      // Notify requester
      await prisma.notification.create({
        data: {
          userId: requesterId,
          type: 'workspace_rejected',
          title: 'Workspace Request Rejected',
          message: `Your request for "${workspace.name}" was rejected. Reason: ${reason}`,
          isRead: false,
        },
      });

      return jsonOk({ success: true, status: 'REJECTED', reason });
    }

    return jsonError('BAD_REQUEST', 'Unknown action');
  } catch (err) {
    return mapAuthzError(err);
  }
}
