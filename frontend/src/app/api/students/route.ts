import { prisma } from '@/lib/prisma';
import { mapAuthzError } from '@/lib/school/http';
import { jsonOk } from '@/lib/school/http';
import { requireSchoolAuth, requireTeacherOrPrincipal } from '@/lib/school/authz';
import { NextRequest } from 'next/server';

export async function GET() {
  try {
    const ctx = await requireSchoolAuth();
    requireTeacherOrPrincipal(ctx);

    const students = await prisma.user.findMany({
      where: { workspaceId: ctx.workspaceId, role: 'student' },
      select: { id: true, name: true, email: true, isActive: true, status: true },
      orderBy: { createdAt: 'desc' },
    });

    const classLinks = await prisma.classStudent.findMany({
      where: { Class: { workspaceId: ctx.workspaceId } },
      select: { studentId: true, Class: { select: { id: true, name: true } } },
    });

    const classByStudent = new Map<string, { id: string; name: string }>();
    for (const link of classLinks) classByStudent.set(link.studentId, link.Class);

    return jsonOk(
      students.map(s => ({
        ...s,
        class: classByStudent.get(s.id) ?? null,
      }))
    );
  } catch (err) {
    return mapAuthzError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    requireTeacherOrPrincipal(ctx);

    const body = (await req.json()) as { name?: string; email?: string; password?: string; classId?: string };
    const name = (body.name || '').trim();
    const email = (body.email || '').trim().toLowerCase();

    if (!name) throw new Error('BAD_REQUEST');
    if (!email) throw new Error('BAD_REQUEST');

    const student = await prisma.user.create({
      data: {
        name,
        email,
        role: 'student',
        workspaceId: ctx.workspaceId,
        passwordHash: body.password ? body.password : null,
        isActive: true,
        status: 'ACTIVE',
      },
      select: { id: true, name: true, email: true, isActive: true, status: true },
    });

    if (body.classId) {
      const klass = await prisma.class.findFirst({ where: { id: body.classId, workspaceId: ctx.workspaceId } });
      if (klass) {
        await prisma.classStudent.upsert({
          where: { classId_studentId: { classId: klass.id, studentId: student.id } },
          create: { classId: klass.id, studentId: student.id },
          update: {},
        });
      }
    }

    await prisma.schoolLog.create({
      data: { actionType: 'student_created', entityId: student.id, role: ctx.role, userId: ctx.userId },
    });

    return jsonOk(student, { status: 201 });
  } catch (err) {
    return mapAuthzError(err);
  }
}

