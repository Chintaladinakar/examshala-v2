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

export const approveLink = async (linkId: string, approvedByUserId: string) => {
  const link = await prisma.parentStudentLink.findUnique({ where: { id: linkId } });
  if (!link) {
    throw new Error('Parent link not found.');
  }
  if (!['pending', 'removal_requested'].includes(link.status)) {
    throw new Error(`Cannot approve a link with status "${link.status}".`);
  }

  // Approving a new-link request activates it; approving a removal request completes it.
  if (link.status === 'removal_requested') {
    await prisma.auditLog.create({
      data: {
        userId: approvedByUserId,
        action: 'APPROVED_PARENT_REMOVAL',
        entityType: 'ParentStudentLink',
        entityId: linkId,
      },
    });
    return prisma.parentStudentLink.delete({ where: { id: linkId } });
  }

  const updated = await prisma.parentStudentLink.update({
    where: { id: linkId },
    data: {
      status: 'active',
      linkedAt: new Date(),
      approvalMetadata: { approvedBy: approvedByUserId, approvedAt: new Date().toISOString() },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: approvedByUserId,
      action: 'APPROVED_PARENT_LINK',
      entityType: 'ParentStudentLink',
      entityId: link.id,
    },
  });

  return updated;
};

export const rejectLink = async (linkId: string, rejectedByUserId: string) => {
  const link = await prisma.parentStudentLink.findUnique({ where: { id: linkId } });
  if (!link) {
    throw new Error('Parent link not found.');
  }
  if (!['pending', 'removal_requested'].includes(link.status)) {
    throw new Error(`Cannot reject a link with status "${link.status}".`);
  }

  // A rejected removal request reverts the link to active; a rejected new
  // link request is deleted outright since it was never established.
  const result = link.status === 'removal_requested'
    ? await prisma.parentStudentLink.update({
        where: { id: linkId },
        data: { status: 'active', removalRequestedBy: null },
      })
    : await prisma.parentStudentLink.delete({ where: { id: linkId } });

  await prisma.auditLog.create({
    data: {
      userId: rejectedByUserId,
      action: 'REJECTED_PARENT_LINK',
      entityType: 'ParentStudentLink',
      entityId: linkId,
    },
  });

  return result;
};
