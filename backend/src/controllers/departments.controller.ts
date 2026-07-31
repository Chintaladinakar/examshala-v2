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
    res.status(403).json({ success: false, code: 'ACCESS_DENIED', message: 'Only the Principal can manage departments.' });
    return null;
  }
  return user;
}

export const listDepartments = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await loadPrincipal(req, res);
  if (!user) return;
  try {
    const departments = await prisma.department.findMany({
      where: { workspaceId: user.workspaceId! },
      include: { classes: { select: { id: true } }, subjects: { select: { id: true } } },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: departments.map((d) => ({ id: d.id, name: d.name, classCount: d.classes.length, subjectCount: d.subjects.length, createdAt: d.createdAt })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await loadPrincipal(req, res);
  if (!user) return;
  try {
    const name = (req.body?.name || '').trim();
    if (!name) {
      res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'name is required.' });
      return;
    }

    const existing = await prisma.department.findFirst({ where: { workspaceId: user.workspaceId!, name } });
    if (existing) {
      res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'Department already exists.' });
      return;
    }

    const department = await prisma.department.create({ data: { name, workspaceId: user.workspaceId! } });
    await prisma.schoolLog.create({ data: { actionType: 'department_created', entityId: department.id, role: user.role, userId: user.id } });

    res.status(201).json({ success: true, data: { id: department.id, name: department.name, classCount: 0, subjectCount: 0, createdAt: department.createdAt } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await loadPrincipal(req, res);
  if (!user) return;
  try {
    const id = req.params.id as string;
    const department = await prisma.department.findFirst({ where: { id, workspaceId: user.workspaceId! } });
    if (!department) {
      res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Department not found.' });
      return;
    }

    const name = (req.body?.name || '').trim();
    if (!name) {
      res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'name is required.' });
      return;
    }

    const duplicate = await prisma.department.findFirst({ where: { workspaceId: user.workspaceId!, name, id: { not: id } } });
    if (duplicate) {
      res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'Department already exists.' });
      return;
    }

    const updated = await prisma.department.update({ where: { id }, data: { name } });
    await prisma.schoolLog.create({ data: { actionType: 'department_updated', entityId: id, role: user.role, userId: user.id } });

    res.json({ success: true, data: { id: updated.id, name: updated.name } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await loadPrincipal(req, res);
  if (!user) return;
  try {
    const id = req.params.id as string;
    const department = await prisma.department.findFirst({ where: { id, workspaceId: user.workspaceId! } });
    if (!department) {
      res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Department not found.' });
      return;
    }

    await prisma.department.delete({ where: { id } });
    await prisma.schoolLog.create({ data: { actionType: 'department_deleted', entityId: id, role: user.role, userId: user.id } });

    res.json({ success: true, data: { id } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
