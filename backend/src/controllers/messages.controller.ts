import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import { createNotification } from '../services/notification.service';

async function loadRequestingUser(req: AuthRequest) {
  const userId = req.user?.userId;
  return prisma.user.findUnique({ where: { id: userId } });
}

// A user may only message people they have a real relationship with in the workspace:
// teacher <-> their students, teacher <-> those students' linked parents, teacher <-> principal.
async function getAllowedContactIds(user: { id: string; workspaceId: string | null; role: string }): Promise<Set<string>> {
  const allowed = new Set<string>();
  const role = user.role.toLowerCase();

  if (role === 'teacher') {
    const classLinks = await prisma.classTeacher.findMany({ where: { teacherId: user.id }, select: { classId: true } });
    const classIds = classLinks.map((c) => c.classId);

    const classStudents = await prisma.classStudent.findMany({ where: { classId: { in: classIds } }, select: { studentId: true } });
    const studentIds = classStudents.map((c) => c.studentId);
    studentIds.forEach((id) => allowed.add(id));

    const parentLinks = await prisma.parentStudentLink.findMany({
      where: { studentId: { in: studentIds }, status: 'active' },
      select: { parentUserId: true },
    });
    parentLinks.forEach((p) => p.parentUserId && allowed.add(p.parentUserId));

    const principals = await prisma.user.findMany({ where: { workspaceId: user.workspaceId, role: 'principal' }, select: { id: true } });
    principals.forEach((p) => allowed.add(p.id));
  } else if (role === 'principal') {
    const workspaceUsers = await prisma.user.findMany({ where: { workspaceId: user.workspaceId }, select: { id: true } });
    workspaceUsers.forEach((u) => allowed.add(u.id));
  } else if (role === 'student') {
    const classLinks = await prisma.classStudent.findMany({ where: { studentId: user.id }, select: { classId: true } });
    const classIds = classLinks.map((c) => c.classId);
    const teacherLinks = await prisma.classTeacher.findMany({ where: { classId: { in: classIds } }, select: { teacherId: true } });
    teacherLinks.forEach((t) => allowed.add(t.teacherId));
  } else if (role === 'parent') {
    const links = await prisma.parentStudentLink.findMany({ where: { parentUserId: user.id, status: 'active' }, select: { studentId: true } });
    const studentIds = links.map((l) => l.studentId);
    const classLinks = await prisma.classStudent.findMany({ where: { studentId: { in: studentIds } }, select: { classId: true } });
    const classIds = classLinks.map((c) => c.classId);
    const teacherLinks = await prisma.classTeacher.findMany({ where: { classId: { in: classIds } }, select: { teacherId: true } });
    teacherLinks.forEach((t) => allowed.add(t.teacherId));
  }

  allowed.delete(user.id);
  return allowed;
}

export const getContacts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, message: 'Workspace mapping not found.' });
      return;
    }

    const allowedIds = await getAllowedContactIds(user);
    const contacts = await prisma.user.findMany({
      where: { id: { in: Array.from(allowedIds) } },
      select: { id: true, name: true, role: true, email: true },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: contacts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, message: 'Workspace mapping not found.' });
      return;
    }

    const links = await prisma.conversationParticipant.findMany({
      where: { userId: user.id },
      include: {
        Conversation: {
          include: {
            participants: { include: { User: { select: { id: true, name: true, role: true } } } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { Conversation: { lastMessageAt: 'desc' } },
    });

    const data = await Promise.all(
      links.map(async (link) => {
        const conv = link.Conversation;
        const other = conv.participants.find((p) => p.userId !== user.id)?.User;
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: user.id },
            createdAt: { gt: link.lastReadAt ?? new Date(0) },
          },
        });
        return {
          conversationId: conv.id,
          otherUser: other,
          lastMessage: conv.messages[0] || null,
          lastMessageAt: conv.lastMessageAt,
          unreadCount,
        };
      })
    );

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const startConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, message: 'Workspace mapping not found.' });
      return;
    }

    const { recipientUserId } = req.body;
    if (!recipientUserId) {
      res.status(400).json({ success: false, message: 'recipientUserId is required.' });
      return;
    }

    const allowedIds = await getAllowedContactIds(user);
    if (!allowedIds.has(recipientUserId)) {
      res.status(403).json({ success: false, message: 'You do not have a messaging relationship with this user.' });
      return;
    }

    const existing = await prisma.conversationParticipant.findFirst({
      where: {
        userId: user.id,
        Conversation: { participants: { some: { userId: recipientUserId } } },
      },
      select: { conversationId: true },
    });

    if (existing) {
      res.json({ success: true, data: { conversationId: existing.conversationId } });
      return;
    }

    const conversation = await prisma.conversation.create({
      data: {
        workspaceId: user.workspaceId,
        participants: { create: [{ userId: user.id }, { userId: recipientUserId }] },
      },
    });

    res.status(201).json({ success: true, data: { conversationId: conversation.id } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

async function assertParticipant(conversationId: string, userId: string) {
  return prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
}

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user) {
      res.status(400).json({ success: false, message: 'User not found.' });
      return;
    }

    const { id } = req.params;
    const participant = await assertParticipant(id as string, user.id);
    if (!participant) {
      res.status(403).json({ success: false, message: 'Not a participant in this conversation.' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id as string },
      include: { Sender: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId: id as string, userId: user.id } },
      data: { lastReadAt: new Date() },
    });

    res.json({ success: true, data: messages });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user) {
      res.status(400).json({ success: false, message: 'User not found.' });
      return;
    }

    const { id } = req.params;
    const participant = await assertParticipant(id as string, user.id);
    if (!participant) {
      res.status(403).json({ success: false, message: 'Not a participant in this conversation.' });
      return;
    }

    const { body, attachmentUrl } = req.body;
    if (!body || !body.trim()) {
      res.status(400).json({ success: false, message: 'Message body is required.' });
      return;
    }

    const message = await prisma.message.create({
      data: { conversationId: id as string, senderId: user.id, body: body.trim(), attachmentUrl: attachmentUrl || undefined },
      include: { Sender: { select: { id: true, name: true } } },
    });

    await prisma.conversation.update({ where: { id: id as string }, data: { lastMessageAt: new Date() } });
    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId: id as string, userId: user.id } },
      data: { lastReadAt: new Date() },
    });

    const otherParticipant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: id as string, userId: { not: user.id } },
    });
    if (otherParticipant) {
      await createNotification({
        userId: otherParticipant.userId,
        workspaceId: user.workspaceId,
        type: 'new_message',
        title: `New message from ${user.name}`,
        message: message.body.slice(0, 120),
        actionUrl: '/messages',
      });
    }

    res.status(201).json({ success: true, data: message });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
