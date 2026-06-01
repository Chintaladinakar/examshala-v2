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
      select: {
        studentId: true,
        Class: { select: { id: true, name: true } },
        Student: { select: { id: true, name: true, email: true, isActive: true, status: true } },
      },
    });

    const studentsMap = new Map<string, any>();
    for (const cs of classStudents) {
      if (!cs.Student) continue;
      if (!studentsMap.has(cs.studentId)) {
        studentsMap.set(cs.studentId, {
          ...cs.Student,
          classes: [cs.Class],
        });
      } else {
        studentsMap.get(cs.studentId).classes.push(cs.Class);
      }
    }

    return jsonOk(Array.from(studentsMap.values()));
  } catch (err) {
    return mapAuthzError(err);
  }
}
