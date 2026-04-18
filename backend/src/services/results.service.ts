import prisma from '../lib/prisma';

export const getStudentResults = async (studentId: string, workspaceIdContext?: string) => {
  const attemptParams: any = { studentId, status: 'evaluated' };
  if (workspaceIdContext) {
    attemptParams.Assignment = { workspaceId: workspaceIdContext };
  }

  const attempts = await prisma.assessmentAttempt.findMany({
    where: attemptParams,
    orderBy: { submittedAt: 'desc' },
    include: {
      Result: true,
      Assignment: {
        include: {
          Test: { select: { title: true, duration: true } },
          Workspace: { select: { name: true } },
        },
      },
    },
  });

  return attempts.map((a) => ({
    id: a.id,
    title: a.Assignment.Test.title,
    workspaceName: a.Assignment.Workspace.name,
    score: a.Result?.score ?? 0,
    maxScore: a.Result?.maxScore ?? 0,
    percentage: a.Result ? Math.round((a.Result.score / a.Result.maxScore) * 100) : 0,
    feedback: a.Result?.feedback ?? null,
    submittedAt: a.submittedAt,
    evaluatedAt: a.Result?.evaluatedAt ?? null,
    duration: a.Assignment.Test.duration,
    assignedBy: a.Assignment.assignedByName,
    assignedByType: a.Assignment.assignedByType,
  }));
};
