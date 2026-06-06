import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSchoolAuth } from '@/lib/school/authz';
import { jsonOk, jsonError, mapAuthzError } from '@/lib/school/http';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    if (ctx.role !== 'org_admin') {
      return jsonError('FORBIDDEN', 'Only Admins can access this resource.', 403);
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('id');

    // Detailed single workspace lookup
    if (workspaceId) {
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!workspace) {
        return jsonError('NOT_FOUND', 'Workspace not found.', 404);
      }

      // Parse metadata from createdBy
      let meta: any = {};
      try {
        if (workspace.createdBy && workspace.createdBy.startsWith('JSON_REQ:')) {
          meta = JSON.parse(workspace.createdBy.replace('JSON_REQ:', ''));
        }
      } catch {}

      // Resolve Principal Name
      let principalName = 'Not Assigned';
      if (workspace.principalId) {
        const principal = await prisma.user.findUnique({
          where: { id: workspace.principalId },
          select: { name: true },
        });
        if (principal) {
          principalName = principal.name;
        }
      } else if (meta.contactName) {
        principalName = meta.contactName;
      }

      // Fetch Statistics
      const teachersCount = await prisma.workspaceMembership.count({
        where: {
          workspaceId: workspaceId,
          role: { in: ['tutor', 'teacher', 'principal'] },
        },
      });

      const studentsCount = await prisma.workspaceMembership.count({
        where: {
          workspaceId: workspaceId,
          role: 'student',
        },
      });

      const classesCount = await prisma.class.count({
        where: { workspaceId },
      });

      // Count distinct subjects
      const assignmentsWithSubjects = await prisma.assignment.findMany({
        where: { Class: { workspaceId } },
        select: { subject: true },
      });
      const foundSubjects = Array.from(
        new Set(assignmentsWithSubjects.map((a: any) => a.subject).filter(Boolean))
      );
      const subjectsCount = Math.max(5, foundSubjects.length); // fallback to min 5 default subjects if empty

      const examsCount = await prisma.assessmentAssignment.count({
        where: { workspaceId },
      });

      const assignmentsCount = await prisma.assignment.count({
        where: { Class: { workspaceId } },
      });

      // Recent Activity Feed
      const recentLogs = await prisma.schoolLog.findMany({
        where: {
          User: { workspaceId },
        },
        include: {
          User: { select: { name: true } },
        },
        orderBy: { timestamp: 'desc' },
        take: 10,
      });

      const recentActivity = recentLogs.map((l: any) => {
        let text = l.actionType.replace(/_/g, ' ');
        text = text.charAt(0).toUpperCase() + text.slice(1);
        return {
          id: l.id,
          action: text,
          user: l.User?.name || 'System',
          timestamp: l.timestamp,
        };
      });

      return jsonOk({
        id: workspace.id,
        name: workspace.name,
        code: meta.code || 'EXM-GEN-8421',
        createdAt: workspace.createdAt,
        principalName,
        principalEmail: meta.email || 'N/A',
        principalPhone: meta.phone || 'N/A',
        status: workspace.status || 'ACTIVE',
        stats: {
          teachers: teachersCount,
          students: studentsCount,
          classes: classesCount,
          subjects: subjectsCount,
          exams: examsCount,
          assignments: assignmentsCount,
        },
        activity: recentActivity,
      });
    }

    // List all approved/registered workspaces
    const workspaces = await prisma.workspace.findMany({
      where: {
        status: { in: ['ACTIVE', 'SUSPENDED'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = await Promise.all(
      workspaces.map(async (w: any) => {
        let meta: any = {};
        try {
          if (w.createdBy && w.createdBy.startsWith('JSON_REQ:')) {
            meta = JSON.parse(w.createdBy.replace('JSON_REQ:', ''));
          }
        } catch {}

        let principalName = 'Not Assigned';
        if (w.principalId) {
          const principal = await prisma.user.findUnique({
            where: { id: w.principalId },
            select: { name: true },
          });
          if (principal) {
            principalName = principal.name;
          }
        } else if (meta.contactName) {
          principalName = meta.contactName;
        }

        const teachersCount = await prisma.workspaceMembership.count({
          where: {
            workspaceId: w.id,
            role: { in: ['tutor', 'teacher', 'principal'] },
          },
        });

        const studentsCount = await prisma.workspaceMembership.count({
          where: {
            workspaceId: w.id,
            role: 'student',
          },
        });

        return {
          id: w.id,
          name: w.name,
          principal: principalName,
          teachersCount,
          studentsCount,
          createdAt: w.createdAt,
          status: w.status || 'ACTIVE',
        };
      })
    );

    return jsonOk(data);
  } catch (err) {
    return mapAuthzError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    if (ctx.role !== 'org_admin') {
      return jsonError('FORBIDDEN', 'Only Admins can perform this action.', 403);
    }

    const body = (await req.json()) as {
      workspaceId: string;
      action: 'suspend' | 'activate';
    };

    const { workspaceId, action } = body;
    if (!workspaceId) return jsonError('BAD_REQUEST', 'workspaceId is required.');

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) return jsonError('NOT_FOUND', 'Workspace not found.');

    const newStatus = action === 'suspend' ? 'SUSPENDED' : 'ACTIVE';

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { status: newStatus },
    });

    // Create Audit Log
    await prisma.schoolLog.create({
      data: {
        actionType: `workspace_${action}ed`,
        entityId: workspaceId,
        role: ctx.role,
        userId: ctx.userId,
      },
    });

    // Send notifications to Principal
    if (workspace.principalId) {
      await prisma.notification.create({
        data: {
          userId: workspace.principalId,
          workspaceId: workspaceId,
          type: `workspace_${action}ed`,
          title: action === 'suspend' ? 'Workspace Suspended' : 'Workspace Activated',
          message:
              action === 'suspend'
                  ? `Your workspace "${workspace.name}" has been suspended by the administrator.`
                  : `Your workspace "${workspace.name}" has been reactivated. Access restored.`,
          isRead: false,
        },
      });
    }

    return jsonOk({ success: true, status: newStatus });
  } catch (err) {
    return mapAuthzError(err);
  }
}
