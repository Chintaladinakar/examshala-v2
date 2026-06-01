import { prisma } from '@/lib/prisma';
import { jsonOk, mapAuthzError } from '@/lib/school/http';
import { requireSchoolAuth, requireTeacherOrPrincipal } from '@/lib/school/authz';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ctx = await requireSchoolAuth();
    requireTeacherOrPrincipal(ctx);

    const assessmentAssignments = await prisma.assessmentAssignment.findMany({
      where: { workspaceId: ctx.workspaceId },
      select: {
        id: true,
        assignedByName: true,
        assignedAt: true,
        scheduleWindowStart: true,
        scheduleWindowEnd: true,
        isReady: true,
        tutorInstructions: true,
        Test: {
          select: {
            id: true,
            title: true,
            duration: true,
            instructions: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return jsonOk(assessmentAssignments);
  } catch (err) {
    return mapAuthzError(err);
  }
}
