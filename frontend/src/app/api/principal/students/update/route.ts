import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSchoolAuth, requirePrincipal } from '@/lib/school/authz';
import { jsonOk, jsonError, mapAuthzError } from '@/lib/school/http';

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    requirePrincipal(ctx);

    const body = (await req.json()) as {
      studentId: string;
      action: 'toggle_status' | 'update_profile' | 'transfer_class';
      isActive?: boolean;
      name?: string;
      email?: string;
      phone?: string;
      parentName?: string;
      parentPhone?: string;
      classId?: string;
      targetClassId?: string;
    };

    const { studentId, action } = body;
    if (!studentId) return jsonError('BAD_REQUEST', 'studentId is required');

    // Confirm student exists
    const student = await prisma.user.findFirst({
      where: { id: studentId, workspaceId: ctx.workspaceId, role: 'student' },
    });

    if (!student) return jsonError('NOT_FOUND', 'Student not found');

    if (action === 'toggle_status') {
      const nextActive = typeof body.isActive === 'boolean' ? body.isActive : !student.isActive;
      const updated = await prisma.user.update({
        where: { id: studentId },
        data: {
          isActive: nextActive,
          status: nextActive ? 'ACTIVE' : 'INACTIVE',
        },
      });

      await prisma.schoolLog.create({
        data: {
          actionType: nextActive ? 'student_activated' : 'student_deactivated',
          entityId: studentId,
          role: ctx.role,
          userId: ctx.userId,
        },
      });

      return jsonOk({ id: studentId, isActive: updated.isActive, status: updated.status });
    }

    if (action === 'transfer_class') {
      const { targetClassId } = body;
      
      // Wipe old class assignments
      await prisma.classStudent.deleteMany({
        where: { studentId },
      });

      let nextClass = null;
      if (targetClassId) {
        const target = await prisma.class.findFirst({
          where: { id: targetClassId, workspaceId: ctx.workspaceId },
        });
        if (!target) return jsonError('BAD_REQUEST', 'Target class not found in this workspace');
        
        await prisma.classStudent.create({
          data: {
            classId: targetClassId,
            studentId,
          },
        });
        nextClass = { id: target.id, name: target.name };
      }

      await prisma.schoolLog.create({
        data: {
          actionType: 'student_transferred',
          entityId: studentId,
          role: ctx.role,
          userId: ctx.userId,
        },
      });

      return jsonOk({ id: studentId, class: nextClass });
    }

    if (action === 'update_profile') {
      const name = (body.name || '').trim();
      const email = (body.email || '').trim().toLowerCase();

      if (!name || !email) {
        return jsonError('BAD_REQUEST', 'Name and email are required');
      }

      const updated = await prisma.user.update({
        where: { id: studentId },
        data: { name, email },
      });

      await prisma.schoolLog.create({
        data: {
          actionType: 'student_profile_updated',
          entityId: studentId,
          role: ctx.role,
          userId: ctx.userId,
        },
      });

      return jsonOk({
        id: studentId,
        name: updated.name,
        email: updated.email,
        phone: body.phone,
        parentName: body.parentName,
        parentContact: body.parentPhone,
      });
    }

    return jsonError('BAD_REQUEST', 'Unknown action');
  } catch (err) {
    return mapAuthzError(err);
  }
}
