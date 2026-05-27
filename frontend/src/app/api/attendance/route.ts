import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapAuthzError, jsonError, jsonOk } from '@/lib/school/http';
import { requireSchoolAuth, requireTeacherOrPrincipal } from '@/lib/school/authz';

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isWithin24Hours(attDate: Date) {
  const now = Date.now();
  return now - attDate.getTime() <= 24 * 60 * 60 * 1000;
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    const { isTeacher, isPrincipal } = requireTeacherOrPrincipal(ctx);

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId') || '';
    const dateStr = searchParams.get('date') || '';
    if (!classId || !dateStr) return jsonError('BAD_REQUEST', 'classId and date required', 400);

    const date = startOfDay(new Date(dateStr));
    if (Number.isNaN(date.getTime())) return jsonError('BAD_REQUEST', 'invalid date', 400);

    const klass = await prisma.class.findFirst({ where: { id: classId, workspaceId: ctx.workspaceId } });
    if (!klass) return jsonError('NOT_FOUND', 'Class not found', 404);

    if (isTeacher && !isPrincipal) {
      const assigned = await prisma.classTeacher.findFirst({
        where: { classId: klass.id, teacherId: ctx.userId },
        select: { id: true },
      });
      if (!assigned) return jsonError('FORBIDDEN', 'Not assigned to this class', 403);
    }

    const roster = await prisma.classStudent.findMany({
      where: { classId: klass.id },
      select: { Student: { select: { id: true, name: true, email: true, isActive: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const attendance = await prisma.attendance.findMany({
      where: { classId: klass.id, date },
      select: { id: true, studentId: true, status: true, isLocked: true, createdAt: true, lastUpdatedBy: true },
    });
    const byStudent = new Map(attendance.map(a => [a.studentId, a]));

    return jsonOk({
      class: { id: klass.id, name: klass.name },
      date: date.toISOString(),
      students: roster.map(r => ({
        ...r.Student,
        attendance: byStudent.get(r.Student.id) ?? null,
      })),
    });
  } catch (err) {
    return mapAuthzError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    requireTeacherOrPrincipal(ctx);

    const body = (await req.json()) as { classId?: string; date?: string; entries?: { studentId: string; status: string }[] };
    if (!body.classId || !body.date || !Array.isArray(body.entries)) {
      return jsonError('BAD_REQUEST', 'classId, date, entries required', 400);
    }

    const date = startOfDay(new Date(body.date));
    if (Number.isNaN(date.getTime())) return jsonError('BAD_REQUEST', 'invalid date', 400);

    const klass = await prisma.class.findFirst({ where: { id: body.classId, workspaceId: ctx.workspaceId } });
    if (!klass) return jsonError('NOT_FOUND', 'Class not found', 404);

    const allowedStudents = await prisma.classStudent.findMany({
      where: { classId: klass.id },
      select: { studentId: true },
    });
    const allowed = new Set(allowedStudents.map(s => s.studentId));

    const createData = body.entries
      .filter(e => allowed.has(e.studentId))
      .map(e => ({
        classId: klass.id,
        studentId: e.studentId,
        date,
        status: e.status === 'absent' ? 'absent' : 'present',
        markedByUserId: ctx.userId,
        lastUpdatedBy: ctx.userId,
        isLocked: !isWithin24Hours(date),
      }));

    for (const entry of createData) {
      await prisma.attendance.upsert({
        where: { classId_studentId_date: { classId: entry.classId, studentId: entry.studentId, date: entry.date } },
        create: entry,
        update: { status: entry.status, lastUpdatedBy: ctx.userId },
      });
    }

    await prisma.schoolLog.create({
      data: { actionType: 'attendance_marked', entityId: klass.id, role: ctx.role, userId: ctx.userId },
    });

    return jsonOk({ ok: true }, { status: 201 });
  } catch (err) {
    return mapAuthzError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    const { isPrincipal } = requireTeacherOrPrincipal(ctx);

    const body = (await req.json()) as { attendanceId?: string; status?: string };
    if (!body.attendanceId || !body.status) return jsonError('BAD_REQUEST', 'attendanceId and status required', 400);

    const record = await prisma.attendance.findFirst({
      where: { id: body.attendanceId, Class: { workspaceId: ctx.workspaceId } },
      select: { id: true, date: true, isLocked: true },
    });
    if (!record) return jsonError('NOT_FOUND', 'Attendance not found', 404);

    const editable = isWithin24Hours(record.date);
    if ((record.isLocked || !editable) && !isPrincipal) {
      return jsonError('LOCKED', 'Attendance is locked after 24 hours', 423);
    }

    const updated = await prisma.attendance.update({
      where: { id: record.id },
      data: {
        status: body.status === 'absent' ? 'absent' : 'present',
        lastUpdatedBy: ctx.userId,
        isLocked: record.isLocked || !editable,
      },
      select: { id: true, status: true, isLocked: true },
    });

    await prisma.schoolLog.create({
      data: { actionType: 'attendance_updated', entityId: updated.id, role: ctx.role, userId: ctx.userId },
    });

    return jsonOk(updated);
  } catch (err) {
    return mapAuthzError(err);
  }
}

