import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import { createNotification } from '../services/notification.service';

async function loadRequestingUser(req: AuthRequest) {
  const userId = req.user?.userId;
  return prisma.user.findUnique({ where: { id: userId } });
}

export const createLeaveRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, message: 'Workspace mapping not found.' });
      return;
    }

    const { startDate, endDate, reason } = req.body;
    if (!startDate || !endDate || !reason) {
      res.status(400).json({ success: false, message: 'startDate, endDate, and reason are required.' });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      res.status(400).json({ success: false, message: 'Invalid date range.' });
      return;
    }

    const role = user.role.toLowerCase();
    const requesterRole = role === 'teacher' || role === 'tutor' ? 'teacher' : 'student';

    const leave = await prisma.leaveRequest.create({
      data: {
        workspaceId: user.workspaceId,
        requesterId: user.id,
        requesterRole,
        startDate: start,
        endDate: end,
        reason,
      },
    });

    const principals = await prisma.user.findMany({
      where: { workspaceId: user.workspaceId, role: 'principal', isActive: true },
      select: { id: true },
    });
    for (const principal of principals) {
      await createNotification({
        userId: principal.id,
        workspaceId: user.workspaceId,
        type: 'leave_requested',
        title: 'New leave request',
        message: `${user.name} requested leave from ${start.toDateString()} to ${end.toDateString()}.`,
        actionUrl: '/principal/leave',
      });
    }

    res.status(201).json({ success: true, data: leave });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const listMyLeaveRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, message: 'Workspace mapping not found.' });
      return;
    }

    const requests = await prisma.leaveRequest.findMany({
      where: { requesterId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: requests });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const listWorkspaceLeaveRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, message: 'Workspace mapping not found.' });
      return;
    }
    if (user.role.toLowerCase() !== 'principal') {
      res.status(403).json({ success: false, message: 'Only principals can view all leave requests.' });
      return;
    }

    const { status, requesterRole } = req.query;
    const where: any = { workspaceId: user.workspaceId };
    if (status) where.status = status as string;
    if (requesterRole) where.requesterRole = requesterRole as string;

    const requests = await prisma.leaveRequest.findMany({
      where,
      include: { Requester: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: requests });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewLeaveRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, message: 'Workspace mapping not found.' });
      return;
    }
    if (user.role.toLowerCase() !== 'principal') {
      res.status(403).json({ success: false, message: 'Only principals can review leave requests.' });
      return;
    }

    const { id } = req.params;
    const { action, reviewNote } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json({ success: false, message: "action must be 'approve' or 'reject'." });
      return;
    }

    const leave = await prisma.leaveRequest.findUnique({ where: { id: id as string } });
    if (!leave || leave.workspaceId !== user.workspaceId) {
      res.status(404).json({ success: false, message: 'Leave request not found.' });
      return;
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: id as string },
      data: {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewNote: reviewNote || null,
        reviewedByUserId: user.id,
        reviewedAt: new Date(),
      },
    });

    await createNotification({
      userId: leave.requesterId,
      workspaceId: user.workspaceId,
      type: action === 'approve' ? 'leave_approved' : 'leave_rejected',
      title: action === 'approve' ? 'Leave approved' : 'Leave rejected',
      message: action === 'approve'
        ? `Your leave request from ${leave.startDate.toDateString()} to ${leave.endDate.toDateString()} was approved.`
        : `Your leave request was rejected.${reviewNote ? ` Note: ${reviewNote}` : ''}`,
      actionUrl: '/leave',
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
