import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapAuthzError, jsonError, jsonOk } from '@/lib/school/http';
import { requireSchoolAuth, requireTeacherOrPrincipal } from '@/lib/school/authz';

export async function GET() {
  try {
    const ctx = await requireSchoolAuth();
    const { isTeacher, isPrincipal } = requireTeacherOrPrincipal(ctx);

    let classIds: string[] | undefined;
    if (isTeacher && !isPrincipal) {
      const teacherLinks = await prisma.classTeacher.findMany({
        where: { teacherId: ctx.userId, Class: { workspaceId: ctx.workspaceId } },
        select: { classId: true },
      });
      classIds = teacherLinks.map((t: any) => t.classId);
    }

    const assignments = await prisma.assignment.findMany({
      where: {
        Class: { workspaceId: ctx.workspaceId },
        ...(classIds ? { classId: { in: classIds } } : {}),
      },
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        createdAt: true,
        classId: true,
        Class: { select: { name: true } },
        Creator: { select: { id: true, name: true } },
        feedbacks: { select: { id: true, comment: true, createdAt: true, Creator: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return jsonOk(assignments);
  } catch (err) {
    return mapAuthzError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    const { isTeacher, isPrincipal } = requireTeacherOrPrincipal(ctx);
    if (!isTeacher) return jsonError('FORBIDDEN', 'Only teachers can create assignments', 403);

    const body = (await req.json()) as {
      title?: string;
      description?: string;
      dueDate?: string;
      classId?: string;
      attachLink?: string;
    };

    const title = (body.title || '').trim();
    const description = (body.description || '').trim();
    const dueDate = new Date(body.dueDate || '');
    if (!title || !body.classId || Number.isNaN(dueDate.getTime())) {
      return jsonError('BAD_REQUEST', 'title, classId, dueDate required', 400);
    }

    const klass = await prisma.class.findFirst({ where: { id: body.classId, workspaceId: ctx.workspaceId } });
    if (!klass) return jsonError('NOT_FOUND', 'Class not found', 404);

    if (!isPrincipal) {
      const assigned = await prisma.classTeacher.findFirst({
        where: { classId: klass.id, teacherId: ctx.userId },
        select: { id: true },
      });
      if (!assigned) return jsonError('FORBIDDEN', 'Not assigned to this class', 403);
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description: body.attachLink ? `${description}\n\nLink: ${body.attachLink}`.trim() : description,
        dueDate,
        classId: klass.id,
        createdByUserId: ctx.userId,
        createdRole: ctx.role === 'principal' ? 'principal-teacher-mode' : 'teacher',
      },
      select: { id: true, title: true, description: true, dueDate: true, classId: true, createdAt: true },
    });

    await prisma.schoolLog.create({
      data: { actionType: 'assignment_created', entityId: assignment.id, role: ctx.role, userId: ctx.userId },
    });

    return jsonOk(assignment, { status: 201 });
  } catch (err) {
    return mapAuthzError(err);
  }
}

