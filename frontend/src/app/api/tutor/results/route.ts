import { prisma } from '@/lib/prisma';
import { jsonOk, mapAuthzError } from '@/lib/school/http';
import { requireSchoolAuth, requireTeacherOrPrincipal } from '@/lib/school/authz';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ctx = await requireSchoolAuth();
    const { isTeacher, isPrincipal } = requireTeacherOrPrincipal(ctx);

    let classWhere: any = { workspaceId: ctx.workspaceId };
    if (isTeacher && !isPrincipal) {
      const teacherLinks = await prisma.classTeacher.findMany({
        where: { teacherId: ctx.userId, Class: { workspaceId: ctx.workspaceId } },
        select: { classId: true },
      });
      classWhere = {
        workspaceId: ctx.workspaceId,
        id: { in: teacherLinks.map((t: any) => t.classId) },
      };
    }

    const classes = await prisma.class.findMany({
      where: classWhere,
      select: { id: true },
    });
    const classIds = classes.map((c: any) => c.id);

    const classStudents = await prisma.classStudent.findMany({
      where: { classId: { in: classIds } },
      select: { studentId: true },
    });
    const studentIds = Array.from(new Set(classStudents.map((cs: any) => cs.studentId)));

    const results = await prisma.result.findMany({
      where: { studentId: { in: studentIds } },
      select: {
        id: true,
        subject: true,
        score: true,
        totalMarks: true,
        percentage: true,
        grade: true,
        feedback: true,
        createdAt: true,
        student: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return jsonOk(results);
  } catch (err) {
    return mapAuthzError(err);
  }
}
