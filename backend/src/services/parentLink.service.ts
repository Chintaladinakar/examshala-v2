import prisma from '../lib/prisma';

export const requestParentLink = async (studentId: string, parentEmail: string, relation: string) => {
  // Enforce Max 3 parent links.
  const activeAndPendingCount = await prisma.parentStudentLink.count({
    where: {
      studentId,
      status: { in: ['pending', 'active'] }
    }
  });

  if (activeAndPendingCount >= 3) {
    throw new Error('Maximum of 3 linked parents is allowed per student.');
  }

  // Check if parent account exists already
  const parentUser = await prisma.user.findUnique({
    where: { email: parentEmail }
  });

  const link = await prisma.parentStudentLink.create({
    data: {
      studentId,
      parentUserId: parentUser ? parentUser.id : null,
      pendingParentEmail: !parentUser ? parentEmail : null,
      relation,
      status: 'pending',
      requestedBy: 'student',
    }
  });

  // Log action
  await prisma.auditLog.create({
    data: {
      userId: studentId,
      action: 'REQUESTED_PARENT_LINK',
      entityType: 'ParentStudentLink',
      entityId: link.id,
      details: { parentEmail, relation }
    }
  });

  return link;
};

export const getStudentParents = async (studentId: string) => {
  return await prisma.parentStudentLink.findMany({
    where: { studentId },
    include: {
      Parent: { select: { id: true, name: true, email: true } }
    }
  });
};

export const requestLinkRemoval = async (studentId: string, linkId: string) => {
  const link = await prisma.parentStudentLink.findFirst({
    where: { id: linkId, studentId }
  });

  if (!link) {
    throw new Error('Parent link not found.');
  }

  const updated = await prisma.parentStudentLink.update({
    where: { id: linkId },
    data: {
      status: 'removal_requested',
      removalRequestedBy: 'student'
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: studentId,
      action: 'REQUESTED_PARENT_REMOVAL',
      entityType: 'ParentStudentLink',
      entityId: link.id,
    }
  });

  return updated;
};
