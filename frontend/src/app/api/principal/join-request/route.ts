import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSchoolAuth, requireTeacherOrPrincipal } from '@/lib/school/authz';
import { jsonOk, jsonError, mapAuthzError } from '@/lib/school/http';

export async function GET() {
  try {
    const ctx = await requireSchoolAuth();
    // Only Principal or Teachers can check requests, but Principal evaluates them
    const { isPrincipal } = requireTeacherOrPrincipal(ctx);

    // Fetch all pending join requests (Invite status = 'PENDING_APPROVAL')
    const invites = await prisma.invite.findMany({
      where: {
        workspaceId: ctx.workspaceId,
        status: 'PENDING_APPROVAL',
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map email to actual users in the database to fetch their names
    const emails = invites.map((i: any) => i.email);
    const users = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((u: any) => [u.email, u]));

    const data = invites.map((i: any) => {
      const u = userMap.get(i.email);
      return {
        id: i.id,
        name: u?.name || 'Academic Applicant',
        email: i.email,
        requestedRole: i.role || 'Tutor',
        requestDate: i.createdAt,
        status: 'Pending Approval',
      };
    });

    return jsonOk(data);
  } catch (err) {
    return mapAuthzError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();

    const body = (await req.json()) as {
      joinCode: string;
      requestedRole?: string;
    };

    const joinCode = (body.joinCode || '').trim().toUpperCase();
    const requestedRole = body.requestedRole || 'Tutor';

    if (!joinCode) {
      return jsonError('BAD_REQUEST', 'Join Code is required.');
    }

    // Find the workspace by checking the serialized codes in active workspaces
    // We generated workspace codes as 'EXM-ABC-8421' and stored them in settings or custom createdBy strings
    const workspaces = await prisma.workspace.findMany({
      where: { status: 'ACTIVE' },
    });

    let targetWorkspace = null;
    for (const w of workspaces) {
      // Find code in createdBy metadata or settings
      let wCode = '';
      if (w.createdBy && w.createdBy.startsWith('JSON_REQ:')) {
        try {
          const meta = JSON.parse(w.createdBy.replace('JSON_REQ:', ''));
          wCode = meta.code || '';
        } catch {}
      }
      
      // Fallback matching
      if (wCode.toUpperCase() === joinCode || w.id.substring(0, 8).toUpperCase() === joinCode) {
        targetWorkspace = w;
        break;
      }
    }

    if (!targetWorkspace) {
      return jsonError('NOT_FOUND', 'Invalid Join Code. No active institution found matching this code.');
    }

    // Verify if user already belongs to this workspace
    const existingMembership = await prisma.workspaceMembership.findUnique({
      where: {
        userId_workspaceId: {
          userId: ctx.userId,
          workspaceId: targetWorkspace.id,
        },
      },
    });

    if (existingMembership) {
      return jsonError('BAD_REQUEST', 'You are already a member of this workspace.');
    }

    // Retrieve user email
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { email: true },
    });

    if (!user) return jsonError('UNAUTHORIZED', 'User profile not found');

    // Prevent duplicate pending requests for the same workspace
    const existingRequest = await prisma.invite.findFirst({
      where: {
        email: user.email,
        workspaceId: targetWorkspace.id,
        status: 'PENDING_APPROVAL',
      },
    });

    if (existingRequest) {
      return jsonError('BAD_REQUEST', 'You already have a pending join request for this workspace.');
    }

    // Store join request as Invite status = 'PENDING_APPROVAL'
    const invite = await prisma.invite.create({
      data: {
        email: user.email,
        role: requestedRole,
        workspaceId: targetWorkspace.id,
        status: 'PENDING_APPROVAL',
      },
    });

    await prisma.schoolLog.create({
      data: {
        actionType: 'join_request_submitted',
        entityId: invite.id,
        role: ctx.role,
        userId: ctx.userId,
      },
    });

    // Notify the workspace principal
    if (targetWorkspace.principalId) {
      await prisma.notification.create({
        data: {
          userId: targetWorkspace.principalId,
          workspaceId: targetWorkspace.id,
          type: 'join_request_submitted',
          title: 'New Join Request',
          message: `${ctx.role === 'student' ? 'Student' : 'Tutor'} wishes to join your workspace.`,
          isRead: false,
        },
      });
    }

    return jsonOk({
      id: invite.id,
      workspaceName: targetWorkspace.name,
      status: 'PENDING_APPROVAL',
    }, { status: 201 });
  } catch (err) {
    return mapAuthzError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    requireTeacherOrPrincipal(ctx);

    const body = (await req.json()) as {
      requestId: string;
      action: 'approve' | 'reject';
    };

    const { requestId, action } = body;
    if (!requestId) return jsonError('BAD_REQUEST', 'requestId is required.');

    const invite = await prisma.invite.findUnique({ where: { id: requestId } });
    if (!invite || invite.workspaceId !== ctx.workspaceId) {
      return jsonError('NOT_FOUND', 'Join request not found in your workspace.');
    }

    const applicant = await prisma.user.findUnique({
      where: { email: invite.email },
      select: { id: true, name: true },
    });

    if (!applicant) return jsonError('NOT_FOUND', 'Applicant profile not found.');

    if (action === 'approve') {
      // 1. Establish workspace membership
      await prisma.workspaceMembership.upsert({
        where: {
          userId_workspaceId: {
            userId: applicant.id,
            workspaceId: ctx.workspaceId,
          },
        },
        create: {
          userId: applicant.id,
          workspaceId: ctx.workspaceId,
          role: invite.role.toLowerCase() === 'student' ? 'student' : 'tutor', // Default role Tutor or Student
        },
        update: {},
      });

      // 2. Link user workspace context
      await prisma.user.update({
        where: { id: applicant.id },
        data: {
          workspaceId: ctx.workspaceId,
          role: invite.role.toLowerCase() === 'student' ? 'student' : 'teacher', // default role
        },
      });

      // 3. Mark invite as accepted
      await prisma.invite.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' },
      });

      await prisma.schoolLog.create({
        data: {
          actionType: 'join_request_approved',
          entityId: requestId,
          role: ctx.role,
          userId: ctx.userId,
        },
      });

      // Notify applicant
      await prisma.notification.create({
        data: {
          userId: applicant.id,
          workspaceId: ctx.workspaceId,
          type: 'join_request_approved',
          title: 'Join Request Approved',
          message: 'Congratulations! Your request to join the workspace has been approved.',
          isRead: false,
        },
      });

      return jsonOk({ success: true, status: 'APPROVED' });
    }

    if (action === 'reject') {
      await prisma.invite.update({
        where: { id: requestId },
        data: { status: 'REJECTED' },
      });

      await prisma.schoolLog.create({
        data: {
          actionType: 'join_request_rejected',
          entityId: requestId,
          role: ctx.role,
          userId: ctx.userId,
        },
      });

      // Notify applicant
      await prisma.notification.create({
        data: {
          userId: applicant.id,
          type: 'join_request_rejected',
          title: 'Join Request Rejected',
          message: 'Your request to join the workspace has been rejected by the Principal.',
          isRead: false,
        },
      });

      return jsonOk({ success: true, status: 'REJECTED' });
    }

    return jsonError('BAD_REQUEST', 'Unknown action');
  } catch (err) {
    return mapAuthzError(err);
  }
}
