import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';

async function loadPrincipal(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.workspaceId) {
    res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
    return null;
  }
  if (user.role.toLowerCase() !== 'principal') {
    res.status(403).json({ success: false, code: 'ACCESS_DENIED', message: 'Only the Principal can manage subjects.' });
    return null;
  }
  return user;
}

export const listSubjects = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await loadPrincipal(req, res);
  if (!user) return;
  try {
    const departmentId = (req.query.departmentId as string) || undefined;

    const subjects = await prisma.subject.findMany({
      where: { workspaceId: user.workspaceId!, ...(departmentId ? { departmentId } : {}) },
      include: { Department: { select: { id: true, name: true } }, teachers: { include: { Teacher: { select: { id: true, name: true } } } } },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: subjects.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        department: s.Department ? { id: s.Department.id, name: s.Department.name } : null,
        teachers: s.teachers.map((t) => ({ id: t.Teacher.id, name: t.Teacher.name })),
        createdAt: s.createdAt,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await loadPrincipal(req, res);
  if (!user) return;
  try {
    const name = (req.body?.name || '').trim();
    const code = req.body?.code?.trim() || null;
    const bodyDepartmentId = req.body?.departmentId;

    if (!name) {
      res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'name is required.' });
      return;
    }

    const existing = await prisma.subject.findFirst({ where: { workspaceId: user.workspaceId!, name } });
    if (existing) {
      res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'Subject already exists.' });
      return;
    }

    let departmentId: string | null = null;
    if (bodyDepartmentId) {
      const department = await prisma.department.findFirst({ where: { id: bodyDepartmentId, workspaceId: user.workspaceId! } });
      if (!department) {
        res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'Department not found in this workspace.' });
        return;
      }
      departmentId = department.id;
    }

    const subject = await prisma.subject.create({
      data: { name, code, workspaceId: user.workspaceId!, departmentId },
      include: { Department: { select: { id: true, name: true } } },
    });
    await prisma.schoolLog.create({ data: { actionType: 'subject_created', entityId: subject.id, role: user.role, userId: user.id } });

    res.status(201).json({
      success: true,
      data: {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        department: subject.Department ? { id: subject.Department.id, name: subject.Department.name } : null,
        teachers: [],
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await loadPrincipal(req, res);
  if (!user) return;
  try {
    const id = req.params.id as string;
    const subject = await prisma.subject.findFirst({ where: { id, workspaceId: user.workspaceId! } });
    if (!subject) {
      res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Subject not found.' });
      return;
    }

    const data: { name?: string; code?: string | null; departmentId?: string | null } = {};

    if (req.body?.name !== undefined) {
      const name = req.body.name.trim();
      if (!name) {
        res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'name cannot be empty.' });
        return;
      }
      const duplicate = await prisma.subject.findFirst({ where: { workspaceId: user.workspaceId!, name, id: { not: id } } });
      if (duplicate) {
        res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'Subject already exists.' });
        return;
      }
      data.name = name;
    }

    if (req.body?.code !== undefined) data.code = req.body.code?.trim() || null;

    if (req.body?.departmentId !== undefined) {
      if (req.body.departmentId) {
        const department = await prisma.department.findFirst({ where: { id: req.body.departmentId, workspaceId: user.workspaceId! } });
        if (!department) {
          res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'Department not found in this workspace.' });
          return;
        }
        data.departmentId = department.id;
      } else {
        data.departmentId = null;
      }
    }

    const updated = await prisma.subject.update({ where: { id }, data, include: { Department: { select: { id: true, name: true } } } });
    await prisma.schoolLog.create({ data: { actionType: 'subject_updated', entityId: id, role: user.role, userId: user.id } });

    res.json({
      success: true,
      data: { id: updated.id, name: updated.name, code: updated.code, department: updated.Department ? { id: updated.Department.id, name: updated.Department.name } : null },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await loadPrincipal(req, res);
  if (!user) return;
  try {
    const id = req.params.id as string;
    const subject = await prisma.subject.findFirst({ where: { id, workspaceId: user.workspaceId! } });
    if (!subject) {
      res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Subject not found.' });
      return;
    }

    await prisma.subject.delete({ where: { id } });
    await prisma.schoolLog.create({ data: { actionType: 'subject_deleted', entityId: id, role: user.role, userId: user.id } });

    res.json({ success: true, data: { id } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
