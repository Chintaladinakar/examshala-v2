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

    const attendances = await prisma.attendance.findMany({
      where: { classId: { in: classIds } },
      select: {
        id: true,
        date: true,
        status: true,
        Class: { select: { id: true, name: true } },
        Student: { select: { id: true, name: true } },
        MarkedBy: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
      take: 100,
    });

    return jsonOk(attendances);
  } catch (err) {
    return mapAuthzError(err);
  }
}
