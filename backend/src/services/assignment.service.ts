import prisma from '../lib/prisma';

export const getAssignmentDetails = async (studentId: string, assignmentId: string) => {
  const assignment = await prisma.assessmentAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      Test: {
        select: {
          title: true,
          duration: true,
          instructions: true // default instructions
        }
      }
    }
  });

  if (!assignment) {
    throw new Error('Assignment not found');
  }

  // Enforce access control: student must be in this workspace
  const isMember = await prisma.workspaceMembership.findUnique({
    where: {
      userId_workspaceId: {
        userId: studentId,
        workspaceId: assignment.workspaceId
      }
    }
  });

  if (!isMember) {
    throw new Error('Access denied to this assignment');
  }

  const now = new Date();
  let isEligibleToStart = assignment.isReady;
  
  if (assignment.scheduleWindowStart && now < assignment.scheduleWindowStart) {
    isEligibleToStart = false;
  }
  if (assignment.scheduleWindowEnd && now > assignment.scheduleWindowEnd) {
    isEligibleToStart = false;
  }

  // Merge instructions
  const mergedInstructions = [
    assignment.Test.instructions,
    assignment.tutorInstructions ? `Additional Instructions: ${assignment.tutorInstructions}` : ''
  ].filter(Boolean).join('\n\n');

  return {
    id: assignment.id,
    workspaceId: assignment.workspaceId,
    testTitle: assignment.Test.title,
    duration: assignment.Test.duration,
    assignedBy: assignment.assignedByName,
    assignedByType: assignment.assignedByType,
    assignedAt: assignment.assignedAt,
    scheduleWindowStart: assignment.scheduleWindowStart,
    scheduleWindowEnd: assignment.scheduleWindowEnd,
    isReady: assignment.isReady,
    isEligibleToStart,
    instructions: mergedInstructions,
  };
};
