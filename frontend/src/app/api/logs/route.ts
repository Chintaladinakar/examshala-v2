import { prisma } from '@/lib/prisma';
import { mapAuthzError, jsonOk } from '@/lib/school/http';
import { requirePrincipal, requireSchoolAuth } from '@/lib/school/authz';

export async function GET() {
  try {
    const ctx = await requireSchoolAuth();
    requirePrincipal(ctx);

    const logs = await prisma.schoolLog.findMany({
      take: 200,
      orderBy: { timestamp: 'desc' },
      select: { id: true, actionType: true, entityId: true, timestamp: true, role: true, User: { select: { name: true, email: true } } },
    });

    // Enforce workspace filter by resolving entities back to workspace.
    const filtered: typeof logs = [];
    for (const log of logs) {
      if (log.actionType.startsWith('attendance')) {
        const att = await prisma.attendance.findFirst({
          where: { id: log.entityId, Class: { workspaceId: ctx.workspaceId } },
          select: { id: true },
        });
        if (att) filtered.push(log);
      } else if (log.actionType.startsWith('assignment') || log.actionType.startsWith('feedback')) {
        const assignmentId =
          log.actionType.startsWith('feedback')
            ? (
                await prisma.assignmentFeedback.findFirst({
                  where: { id: log.entityId },
                  select: { assignmentId: true, Assignment: { select: { Class: { select: { workspaceId: true } } } } },
                })
              )?.assignmentId
            : log.entityId;

        if (!assignmentId) continue;
        const ass = await prisma.assignment.findFirst({
          where: { id: assignmentId, Class: { workspaceId: ctx.workspaceId } },
          select: { id: true },
        });
        if (ass) filtered.push(log);
      } else if (log.actionType.startsWith('student') || log.actionType.startsWith('teacher') || log.actionType.startsWith('class')) {
        // EntityId is userId or classId; verify workspace directly
        const user = await prisma.user.findFirst({ where: { id: log.entityId, workspaceId: ctx.workspaceId }, select: { id: true } });
        const klass = await prisma.class.findFirst({ where: { id: log.entityId, workspaceId: ctx.workspaceId }, select: { id: true } });
        if (user || klass) filtered.push(log);
      }
    }

    return jsonOk(filtered);
  } catch (err) {
    return mapAuthzError(err);
  }
}

