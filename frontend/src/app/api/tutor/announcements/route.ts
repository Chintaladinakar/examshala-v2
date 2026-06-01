import { prisma } from '@/lib/prisma';
import { jsonError, jsonOk, mapAuthzError } from '@/lib/school/http';
import { requireSchoolAuth, requireTeacherOrPrincipal } from '@/lib/school/authz';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ctx = await requireSchoolAuth();
    requireTeacherOrPrincipal(ctx);

    const announcements = await prisma.notification.findMany({
      where: {
        workspaceId: ctx.workspaceId,
        type: 'announcement',
      },
      select: {
        id: true,
        title: true,
        message: true,
        actionUrl: true, // author name
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return jsonOk(announcements);
  } catch (err) {
    return mapAuthzError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    const { isPrincipal } = requireTeacherOrPrincipal(ctx);

    if (!isPrincipal) {
      return jsonError('FORBIDDEN', 'Only principal can publish announcements', 403);
    }

    const body = (await req.json()) as { title?: string; message?: string };
    const title = (body.title || '').trim();
    const message = (body.message || '').trim();

    if (!title || !message) {
      return jsonError('BAD_REQUEST', 'Title and message are required', 400);
    }

    const principal = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { name: true },
    });

    const announcement = await prisma.notification.create({
      data: {
        workspaceId: ctx.workspaceId,
        userId: ctx.userId, // Published by principal
        type: 'announcement',
        title,
        message,
        actionUrl: principal?.name || 'School Principal',
      },
    });

    await prisma.schoolLog.create({
      data: {
        actionType: 'announcement_created',
        entityId: announcement.id,
        role: ctx.role,
        userId: ctx.userId,
      },
    });

    return jsonOk(announcement, { status: 201 });
  } catch (err) {
    return mapAuthzError(err);
  }
}
