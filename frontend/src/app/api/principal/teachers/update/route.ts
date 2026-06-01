import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSchoolAuth, requirePrincipal } from '@/lib/school/authz';
import { jsonOk, jsonError, mapAuthzError } from '@/lib/school/http';

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    requirePrincipal(ctx);

    const body = (await req.json()) as {
      teacherId: string;
      action: 'toggle_status' | 'update_profile' | 'assign_classes_subjects';
      isActive?: boolean;
      name?: string;
      email?: string;
      phone?: string;
      qualification?: string;
      experience?: string;
      subjects?: string[];
      classIds?: string[];
    };

    const { teacherId, action } = body;
    if (!teacherId) return jsonError('BAD_REQUEST', 'teacherId is required');

    // Confirm teacher exists
    const teacher = await prisma.user.findFirst({
      where: { id: teacherId, workspaceId: ctx.workspaceId, role: { in: ['teacher', 'tutor'] } },
    });

    if (!teacher) return jsonError('NOT_FOUND', 'Teacher not found');

    if (action === 'toggle_status') {
      const nextActive = typeof body.isActive === 'boolean' ? body.isActive : !teacher.isActive;
      const updated = await prisma.user.update({
        where: { id: teacherId },
        data: {
          isActive: nextActive,
          status: nextActive ? 'ACTIVE' : 'INACTIVE',
        },
      });

      await prisma.schoolLog.create({
        data: {
          actionType: nextActive ? 'teacher_activated' : 'teacher_deactivated',
          entityId: teacherId,
          role: ctx.role,
          userId: ctx.userId,
        },
      });

      return jsonOk({ id: teacherId, isActive: updated.isActive, status: updated.status });
    }

    if (action === 'assign_classes_subjects') {
      // Update assigned classes in the database
      const classIds = Array.isArray(body.classIds) ? body.classIds : [];
      
      // Wipe old classTeacher maps for this workspace
      await prisma.classTeacher.deleteMany({
        where: {
          teacherId,
          Class: { workspaceId: ctx.workspaceId },
        },
      });

      // Write new classTeacher maps
      if (classIds.length > 0) {
        await prisma.classTeacher.createMany({
          data: classIds.map((cid: string) => ({
            classId: cid,
            teacherId,
          })),
          skipDuplicates: true,
        });
      }

      await prisma.schoolLog.create({
        data: {
          actionType: 'teacher_classes_updated',
          entityId: teacherId,
          role: ctx.role,
          userId: ctx.userId,
        },
      });

      const updatedClasses = await prisma.class.findMany({
        where: { id: { in: classIds } },
        select: { id: true, name: true },
      });

      return jsonOk({ id: teacherId, classes: updatedClasses });
    }

    if (action === 'update_profile') {
      const name = (body.name || '').trim();
      const email = (body.email || '').trim().toLowerCase();

      if (!name || !email) {
        return jsonError('BAD_REQUEST', 'Name and email are required');
      }

      const updated = await prisma.user.update({
        where: { id: teacherId },
        data: { name, email },
      });

      await prisma.schoolLog.create({
        data: {
          actionType: 'teacher_profile_updated',
          entityId: teacherId,
          role: ctx.role,
          userId: ctx.userId,
        },
      });

      return jsonOk({
        id: teacherId,
        name: updated.name,
        email: updated.email,
        phone: body.phone,
        qualification: body.qualification,
        experience: body.experience,
        subjects: body.subjects,
      });
    }

    return jsonError('BAD_REQUEST', 'Unknown action');
  } catch (err) {
    return mapAuthzError(err);
  }
}
