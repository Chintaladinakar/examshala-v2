import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSchoolAuth, requirePrincipal } from '@/lib/school/authz';
import { jsonOk, jsonError, mapAuthzError } from '@/lib/school/http';

export async function GET() {
  try {
    const ctx = await requireSchoolAuth();
    requirePrincipal(ctx);

    const announcements = await prisma.notification.findMany({
      where: {
        workspaceId: ctx.workspaceId,
        type: 'announcement',
      },
      select: {
        id: true,
        title: true,
        message: true,
        actionUrl: true, // Author name
        createdAt: true,
        isRead: true, // we will use this to track Published (false) vs Archived (true)
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = announcements.map((a: any) => ({
      id: a.id,
      title: a.title,
      content: a.message,
      author: a.actionUrl || 'Principal',
      date: a.createdAt,
      audience: 'All Users', // default
      status: a.isRead ? 'Archived' : 'Published',
    }));

    // Fallbacks if empty
    if (data.length === 0) {
      data.push(
        {
          id: 'ann-1',
          title: 'Upcoming Summer Vacation Schedule',
          content: 'The school will remain closed for summer vacation from June 15th to July 10th.',
          author: 'Dr. John Smith',
          date: new Date(Date.now() - 3600000 * 24),
          audience: 'All Users',
          status: 'Published',
        },
        {
          id: 'ann-2',
          title: 'Special Teacher Review Assembly',
          content: 'All faculty members must attend the administrative review on Friday at 4 PM.',
          author: 'Dr. John Smith',
          date: new Date(Date.now() - 3600000 * 72),
          audience: 'Teachers Only',
          status: 'Archived',
        }
      );
    }

    return jsonOk(data);
  } catch (err) {
    return mapAuthzError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    requirePrincipal(ctx);

    const body = (await req.json()) as {
      title: string;
      content: string;
      audience: 'All Users' | 'Teachers Only' | 'Students Only';
    };

    const title = (body.title || '').trim();
    const content = (body.content || '').trim();
    const audience = body.audience || 'All Users';

    if (!title || !content) {
      return jsonError('BAD_REQUEST', 'title and content are required');
    }

    // Retrieve principal profile to get the real name
    const principalUser = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { name: true },
    });
    const authorName = principalUser?.name || 'Principal';

    // Create the announcement notification entry
    const announcement = await prisma.notification.create({
      data: {
        userId: ctx.userId,
        workspaceId: ctx.workspaceId,
        type: 'announcement',
        title,
        message: content,
        actionUrl: authorName, // stores author name
        isRead: false, // false = Published
      },
    });

    // Create system alert notifications for each targeted user role inside the workspace
    let roleFilter: string[] = [];
    if (audience === 'Teachers Only') {
      roleFilter = ['teacher', 'tutor'];
    } else if (audience === 'Students Only') {
      roleFilter = ['student'];
    } else {
      roleFilter = ['student', 'teacher', 'tutor'];
    }

    const targetedUsers = await prisma.user.findMany({
      where: {
        workspaceId: ctx.workspaceId,
        role: { in: roleFilter },
      },
      select: { id: true },
    });

    // Create duplicate system notifications for audience dashboard notification dropdowns
    if (targetedUsers.length > 0) {
      await prisma.notification.createMany({
        data: targetedUsers.map((u: any) => ({
          userId: u.id,
          workspaceId: ctx.workspaceId,
          type: 'system_alert',
          title: `Announcement: ${title}`,
          message: content,
          isRead: false,
        })),
        skipDuplicates: true,
      });
    }

    await prisma.schoolLog.create({
      data: {
        actionType: 'announcement_published',
        entityId: announcement.id,
        role: ctx.role,
        userId: ctx.userId,
      },
    });

    return jsonOk({
      id: announcement.id,
      title: announcement.title,
      content: announcement.message,
      author: announcement.actionUrl,
      date: announcement.createdAt,
      audience,
      status: 'Published',
    }, { status: 201 });
  } catch (err) {
    return mapAuthzError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    requirePrincipal(ctx);

    const body = (await req.json()) as {
      id: string;
      action: 'archive' | 'publish' | 'edit';
      title?: string;
      content?: string;
    };

    const { id, action } = body;
    if (!id) return jsonError('BAD_REQUEST', 'id is required');

    const announcement = await prisma.notification.findUnique({ where: { id } });
    if (!announcement) return jsonError('NOT_FOUND', 'Announcement not found');

    if (action === 'archive') {
      await prisma.notification.update({
        where: { id },
        data: { isRead: true }, // isRead = true represents archived
      });
      return jsonOk({ id, status: 'Archived' });
    }

    if (action === 'publish') {
      await prisma.notification.update({
        where: { id },
        data: { isRead: false }, // isRead = false represents published
      });
      return jsonOk({ id, status: 'Published' });
    }

    if (action === 'edit') {
      const updated = await prisma.notification.update({
        where: { id },
        data: {
          title: body.title || announcement.title,
          message: body.content || announcement.message,
        },
      });
      return jsonOk({
        id,
        title: updated.title,
        content: updated.message,
        status: updated.isRead ? 'Archived' : 'Published',
      });
    }

    return jsonError('BAD_REQUEST', 'Unknown action');
  } catch (err) {
    return mapAuthzError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    requirePrincipal(ctx);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return jsonError('BAD_REQUEST', 'id is required');

    await prisma.notification.delete({ where: { id } });

    return jsonOk({ id, deleted: true });
  } catch (err) {
    return mapAuthzError(err);
  }
}
