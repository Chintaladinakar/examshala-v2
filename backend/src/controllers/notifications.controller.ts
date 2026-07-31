import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId, type: { not: 'announcement' } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where: { userId, isRead: false, type: { not: 'announcement' } } }),
    ]);

    res.json({ success: true, data: notifications, unreadCount });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const unreadCount = await prisma.notification.count({ where: { userId, isRead: false, type: { not: 'announcement' } } });
    res.json({ success: true, data: { unreadCount } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({ where: { id: id as string } });
    if (!notification || notification.userId !== userId) {
      res.status(404).json({ success: false, message: 'Notification not found.' });
      return;
    }
    await prisma.notification.update({ where: { id: id as string }, data: { isRead: true } });
    res.json({ success: true, message: 'Marked as read.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
