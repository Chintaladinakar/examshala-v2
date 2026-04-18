import prisma from '../lib/prisma';

export const getStudentNotifications = async (studentId: string, workspaceIdContext?: string) => {
  const where: any = { userId: studentId };
  if (workspaceIdContext) {
    where.workspaceId = workspaceIdContext;
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    actionUrl: n.actionUrl,
    createdAt: n.createdAt,
  }));
};

export const markNotificationsRead = async (studentId: string, notificationIds: string[]) => {
  await prisma.notification.updateMany({
    where: {
      id: { in: notificationIds },
      userId: studentId, // Safety: only mark own notifications
    },
    data: { isRead: true },
  });
};
