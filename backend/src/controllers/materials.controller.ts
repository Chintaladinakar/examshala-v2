import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';

const MATERIAL_TYPES = ['PDF', 'DOC', 'PPT', 'EXCEL', 'IMAGE', 'VIDEO', 'ZIP', 'LINK', 'NOTES'];
const VISIBILITIES = ['draft', 'scheduled', 'published', 'hidden'];

async function loadRequestingUser(req: AuthRequest) {
  const userId = req.user?.userId;
  return prisma.user.findUnique({ where: { id: userId } });
}

async function getScopedClassIds(user: { id: string; workspaceId: string | null; role: string }) {
  const isPrincipal = user.role.toLowerCase() === 'principal';
  const isTeacher = user.role.toLowerCase() === 'teacher';
  if (isTeacher && !isPrincipal) {
    const links = await prisma.classTeacher.findMany({
      where: { teacherId: user.id, Class: { workspaceId: user.workspaceId! } },
      select: { classId: true },
    });
    return links.map((l) => l.classId);
  }
  return null; // null = no class restriction (principal sees all workspace classes)
}

export const getMaterials = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const { subject, type, search, classId, sortBy } = req.query;

    const scopedClassIds = await getScopedClassIds(user);

    const whereClause: any = { workspaceId: user.workspaceId };
    if (scopedClassIds) {
      // A teacher sees materials they uploaded, plus anything scoped to one of their classes.
      whereClause.OR = [{ uploadedByUserId: user.id }, { classId: { in: scopedClassIds } }, { classId: null, uploadedByUserId: user.id }];
    }
    if (subject) whereClause.subject = { equals: subject as string, mode: 'insensitive' };
    if (type) whereClause.type = { equals: (type as string).toUpperCase() };
    if (classId) whereClause.classId = classId as string;
    if (search) whereClause.title = { contains: search as string, mode: 'insensitive' };

    let orderBy: any = { uploadDate: 'desc' };
    if (sortBy === 'oldest') orderBy = { uploadDate: 'asc' };
    else if (sortBy === 'subject') orderBy = { subject: 'asc' };

    const [materials, total] = await Promise.all([
      prisma.material.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: limit,
        include: {
          UploadedBy: { select: { id: true, name: true } },
          Class: { select: { id: true, name: true } },
        },
      }),
      prisma.material.count({ where: whereClause }),
    ]);

    res.json({
      success: true,
      data: materials,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMaterialDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const { id } = req.params;
    const existing = await prisma.material.findUnique({ where: { id: id as string } });
    if (!existing || existing.workspaceId !== user.workspaceId) {
      res.status(404).json({ success: false, message: 'Material not found.' });
      return;
    }

    const material = await prisma.material.update({
      where: { id: id as string },
      data: { viewCount: { increment: 1 } },
      include: { UploadedBy: { select: { id: true, name: true } }, Class: { select: { id: true, name: true } } },
    });

    res.json({ success: true, data: material });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const role = user.role.toLowerCase();
    if (['student', 'parent'].includes(role)) {
      res.status(403).json({ success: false, message: 'Access denied. You do not have permission to post materials.' });
      return;
    }

    const { title, type, fileUrl, subject, chapter, topic, classId, visibility, scheduledAt } = req.body;

    if (!title || !type || !fileUrl || !subject) {
      res.status(400).json({ success: false, message: 'title, type, fileUrl, and subject are required.' });
      return;
    }

    const normalizedType = String(type).toUpperCase();
    if (!MATERIAL_TYPES.includes(normalizedType)) {
      res.status(400).json({ success: false, message: `type must be one of: ${MATERIAL_TYPES.join(', ')}` });
      return;
    }

    try {
      // Reject anything that isn't a well-formed http(s) URL to avoid storing arbitrary payloads.
      const parsed = new URL(fileUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('bad protocol');
    } catch {
      res.status(400).json({ success: false, message: 'fileUrl must be a valid http(s) URL.' });
      return;
    }

    const normalizedVisibility = visibility && VISIBILITIES.includes(visibility) ? visibility : 'published';

    if (classId) {
      const classroom = await prisma.class.findUnique({ where: { id: classId } });
      if (!classroom || classroom.workspaceId !== user.workspaceId) {
        res.status(403).json({ success: false, message: 'Classroom must reside in your workspace.' });
        return;
      }
      if (role === 'teacher') {
        const assigned = await prisma.classTeacher.findFirst({ where: { classId, teacherId: user.id } });
        if (!assigned) {
          res.status(403).json({ success: false, message: 'Not assigned to this class.' });
          return;
        }
      }
    }

    const newMaterial = await prisma.material.create({
      data: {
        title,
        type: normalizedType,
        fileUrl,
        subject,
        chapter: chapter || undefined,
        topic: topic || undefined,
        workspaceId: user.workspaceId,
        classId: classId || undefined,
        uploadedByUserId: user.id,
        visibility: normalizedVisibility,
        scheduledAt: normalizedVisibility === 'scheduled' && scheduledAt ? new Date(scheduledAt) : undefined,
      },
    });

    await prisma.schoolLog.create({
      data: { userId: user.id, role: user.role, actionType: 'material_uploaded', entityId: newMaterial.id },
    }).catch(() => {});

    res.status(201).json({ success: true, data: newMaterial });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const { id } = req.params;
    const material = await prisma.material.findUnique({ where: { id: id as string } });
    if (!material || material.workspaceId !== user.workspaceId) {
      res.status(404).json({ success: false, message: 'Material not found.' });
      return;
    }

    const isPrincipal = user.role.toLowerCase() === 'principal';
    if (!isPrincipal && material.uploadedByUserId !== user.id) {
      res.status(403).json({ success: false, message: 'You can only edit materials you uploaded.' });
      return;
    }

    const { title, subject, chapter, topic, visibility, scheduledAt } = req.body;
    const updated = await prisma.material.update({
      where: { id: id as string },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(subject !== undefined ? { subject } : {}),
        ...(chapter !== undefined ? { chapter } : {}),
        ...(topic !== undefined ? { topic } : {}),
        ...(visibility !== undefined && VISIBILITIES.includes(visibility) ? { visibility } : {}),
        ...(scheduledAt !== undefined ? { scheduledAt: scheduledAt ? new Date(scheduledAt) : null } : {}),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const { id } = req.params;
    const material = await prisma.material.findUnique({ where: { id: id as string } });
    if (!material || material.workspaceId !== user.workspaceId) {
      res.status(404).json({ success: false, message: 'Material not found.' });
      return;
    }

    const isPrincipal = user.role.toLowerCase() === 'principal';
    if (!isPrincipal && material.uploadedByUserId !== user.id) {
      res.status(403).json({ success: false, message: 'You can only delete materials you uploaded.' });
      return;
    }

    await prisma.material.delete({ where: { id: id as string } });

    res.json({ success: true, message: 'Material deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const trackDownload = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const { id } = req.params;
    const existing = await prisma.material.findUnique({ where: { id: id as string } });
    if (!existing || existing.workspaceId !== user.workspaceId) {
      res.status(404).json({ success: false, message: 'Material not found.' });
      return;
    }

    const material = await prisma.material.update({
      where: { id: id as string },
      data: { downloadCount: { increment: 1 } },
    });

    res.json({ success: true, data: { downloadCount: material.downloadCount } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
