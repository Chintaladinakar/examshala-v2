import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapAuthzError, jsonError, jsonOk } from '@/lib/school/http';
import { requireSchoolAuth, requireTeacherOrPrincipal } from '@/lib/school/authz';

export async function GET() {
  try {
    const ctx = await requireSchoolAuth();
    const { isTeacher, isPrincipal } = requireTeacherOrPrincipal(ctx);

    let classWhere: { workspaceId: string; id?: { in: string[] } } = { workspaceId: ctx.workspaceId };

    if (isTeacher && !isPrincipal) {
      const teacherLinks = await prisma.classTeacher.findMany({
        where: { teacherId: ctx.userId, Class: { workspaceId: ctx.workspaceId } },
        select: { classId: true },
      });
      classWhere = { workspaceId: ctx.workspaceId, id: { in: teacherLinks.map((t: any) => t.classId) } };
    }

    const classes = await prisma.class.findMany({
      where: classWhere,
      select: { id: true, name: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const classIds = classes.map((c: any) => c.id);

    const students = await prisma.classStudent.findMany({
      where: { classId: { in: classIds } },
      select: { classId: true, Student: { select: { id: true, name: true, email: true, isActive: true } } },
    });
    const teachers = await prisma.classTeacher.findMany({
      where: { classId: { in: classIds } },
      select: { classId: true, Teacher: { select: { id: true, name: true, email: true, isActive: true } } },
    });

    const studentsByClass = new Map<string, typeof students>();
    for (const s of students) studentsByClass.set(s.classId, [...(studentsByClass.get(s.classId) ?? []), s]);
    const teachersByClass = new Map<string, typeof teachers>();
    for (const t of teachers) teachersByClass.set(t.classId, [...(teachersByClass.get(t.classId) ?? []), t]);

    return jsonOk(
      classes.map((c: any) => ({
        ...c,
        students: studentsByClass.get(c.id) ?? [],
        teachers: teachersByClass.get(c.id) ?? [],
      }))
    );
  } catch (err) {
    return mapAuthzError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    const { isTeacher, isPrincipal } = requireTeacherOrPrincipal(ctx);
    if (isTeacher && !isPrincipal) return jsonError('FORBIDDEN', 'Only principal can create classes', 403);

    const body = (await req.json()) as { name?: string };
    const name = (body.name || '').trim();
    if (!name) return jsonError('BAD_REQUEST', 'name required', 400);

    const klass = await prisma.class.create({
      data: { name, workspaceId: ctx.workspaceId },
      select: { id: true, name: true, createdAt: true },
    });

    await prisma.schoolLog.create({
      data: { actionType: 'class_created', entityId: klass.id, role: ctx.role, userId: ctx.userId },
    });

    return jsonOk(klass, { status: 201 });
  } catch (err) {
    return mapAuthzError(err);
  }
}

