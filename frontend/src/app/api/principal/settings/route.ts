import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSchoolAuth, requirePrincipal } from '@/lib/school/authz';
import { jsonOk, jsonError, mapAuthzError } from '@/lib/school/http';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    requirePrincipal(ctx);

    const { searchParams } = new URL(req.url);
    const filterUser = searchParams.get('userId') || '';
    const filterAction = searchParams.get('actionType') || '';

    // 1. Fetch Workspace Profile
    const workspace = await prisma.workspace.findUnique({
      where: { id: ctx.workspaceId },
      select: { id: true, name: true, createdBy: true, principalId: true },
    });

    // 2. Fetch Classes
    const classes = await prisma.class.findMany({
      where: { workspaceId: ctx.workspaceId },
      include: {
        students: { select: { id: true } },
        teachers: { select: { id: true } },
      },
      orderBy: { name: 'asc' },
    });

    const classData = classes.map((c: any) => ({
      id: c.id,
      name: c.name,
      studentCount: c.students.length,
      teacherCount: c.teachers.length,
      status: 'Active',
    }));

    // 3. Fetch Subjects (We can query distinct subjects from materials or assignments, or mock a beautiful collection)
    const assignmentsWithSubjects = await prisma.assignment.findMany({
      where: { Class: { workspaceId: ctx.workspaceId } },
      select: { subject: true },
    });
    const foundSubjects = Array.from(
      new Set(
        assignmentsWithSubjects
          .map((a: any) => a.subject)
          .filter(Boolean)
      )
    );

    const defaultSubjects = ['Mathematics', 'Science', 'English', 'Physics', 'Chemistry'];
    const finalSubjects = Array.from(new Set([...defaultSubjects, ...foundSubjects])).map((s, idx) => ({
      id: `subj-${idx}`,
      name: s,
      status: 'Active',
    }));

    // 4. Fetch Audit Logs (SchoolLogs)
    const logsWhere: any = {
      User: { workspaceId: ctx.workspaceId },
    };
    if (filterUser) {
      logsWhere.userId = filterUser;
    }
    if (filterAction) {
      logsWhere.actionType = filterAction;
    }

    const logs = await prisma.schoolLog.findMany({
      where: logsWhere,
      include: { User: { select: { name: true, email: true } } },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    const logData = logs.map((l: any) => {
      let module = 'General';
      if (l.actionType.includes('teacher')) module = 'Teachers';
      else if (l.actionType.includes('student')) module = 'Students';
      else if (l.actionType.includes('attendance')) module = 'Attendance';
      else if (l.actionType.includes('assignment')) module = 'Assignments';
      else if (l.actionType.includes('announcement')) module = 'Announcements';
      else if (l.actionType.includes('marks')) module = 'Evaluations';

      let actionText = l.actionType.replace('_', ' ');
      actionText = actionText.charAt(0).toUpperCase() + actionText.slice(1);

      return {
        id: l.id,
        action: actionText,
        user: l.User.name,
        email: l.User.email,
        date: l.timestamp,
        module,
      };
    });

    // Academic settings
    const academicSettings = {
      academicYear: '2026-2027',
      term: 'Term 1',
      semester: 'Semester 1',
    };

    // Workspace Profile details
    const workspaceProfile = {
      id: workspace?.id,
      name: workspace?.name || 'EDUsphere Academy',
      institutionType: 'High School',
      address: '123 Education Drive, Suite 100',
      contactNumber: '+91 94000 87654',
      email: 'admin@edusphere.com',
    };

    return jsonOk({
      workspace: workspaceProfile,
      academicSettings,
      classes: classData,
      subjects: finalSubjects,
      auditLogs: logData,
    });
  } catch (err) {
    return mapAuthzError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    requirePrincipal(ctx);

    const body = (await req.json()) as {
      entityType: 'class' | 'subject';
      name: string; // e.g. "Grade 8A" or "Biology"
    };

    const { entityType, name } = body;
    if (!name) return jsonError('BAD_REQUEST', 'name is required');

    if (entityType === 'class') {
      const existing = await prisma.class.findFirst({
        where: { name, workspaceId: ctx.workspaceId },
      });
      if (existing) return jsonError('BAD_REQUEST', 'Class already exists');

      const klass = await prisma.class.create({
        data: {
          name,
          workspaceId: ctx.workspaceId,
        },
      });

      await prisma.schoolLog.create({
        data: {
          actionType: 'class_created',
          entityId: klass.id,
          role: ctx.role,
          userId: ctx.userId,
        },
      });

      return jsonOk({ id: klass.id, name: klass.name, studentCount: 0, teacherCount: 0, status: 'Active' });
    }

    if (entityType === 'subject') {
      // Create a dummy assignment to save/reserve the subject in Postgres schema naturally
      const classRef = await prisma.class.findFirst({ where: { workspaceId: ctx.workspaceId } });
      if (classRef) {
        await prisma.assignment.create({
          data: {
            title: `Subject Mapping: ${name}`,
            description: `Auto-generated registry entry for subject ${name}`,
            dueDate: new Date(),
            classId: classRef.id,
            createdByUserId: ctx.userId,
            createdRole: 'principal-teacher-mode',
            subject: name,
            status: 'ARCHIVED',
          },
        });
      }

      await prisma.schoolLog.create({
        data: {
          actionType: 'subject_created',
          entityId: `subject:${name}`,
          role: ctx.role,
          userId: ctx.userId,
        },
      });

      return jsonOk({ id: `subj-${Date.now()}`, name, status: 'Active' });
    }

    return jsonError('BAD_REQUEST', 'Unknown entityType');
  } catch (err) {
    return mapAuthzError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    requirePrincipal(ctx);

    const body = (await req.json()) as {
      action: 'update_workspace' | 'update_academic' | 'archive_class' | 'archive_subject';
      workspaceName?: string;
      institutionType?: string;
      address?: string;
      contactNumber?: string;
      email?: string;
      academicYear?: string;
      term?: string;
      classId?: string;
      subjectName?: string;
    };

    const { action } = body;

    if (action === 'update_workspace') {
      const workspaceName = body.workspaceName || 'EDUsphere Academy';
      await prisma.workspace.update({
        where: { id: ctx.workspaceId },
        data: { name: workspaceName },
      });

      await prisma.schoolLog.create({
        data: {
          actionType: 'workspace_updated',
          entityId: ctx.workspaceId,
          role: ctx.role,
          userId: ctx.userId,
        },
      });

      return jsonOk({ success: true });
    }

    if (action === 'archive_class') {
      const { classId } = body;
      if (!classId) return jsonError('BAD_REQUEST', 'classId is required');

      await prisma.class.delete({
        where: { id: classId },
      });

      await prisma.schoolLog.create({
        data: {
          actionType: 'class_deleted',
          entityId: classId,
          role: ctx.role,
          userId: ctx.userId,
        },
      });

      return jsonOk({ success: true, classId });
    }

    return jsonError('BAD_REQUEST', 'Unknown action');
  } catch (err) {
    return mapAuthzError(err);
  }
}
