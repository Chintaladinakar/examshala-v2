import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';

export const getMaterials = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { subject, type, search, teacher, sortBy } = req.query;

    const whereClause: any = {};

    if (subject) {
      whereClause.subject = { equals: subject as string, mode: 'insensitive' };
    }

    if (type) {
      whereClause.type = { equals: type as string, mode: 'insensitive' };
    }

    if (search) {
      whereClause.title = { contains: search as string, mode: 'insensitive' };
    }

    if (teacher) {
      whereClause.uploadedBy = { contains: teacher as string, mode: 'insensitive' };
    }

    let orderBy: any = { uploadDate: 'desc' };
    if (sortBy === 'oldest') {
      orderBy = { uploadDate: 'asc' };
    } else if (sortBy === 'subject') {
      orderBy = { subject: 'asc' };
    }

    const [materials, total] = await Promise.all([
      prisma.material.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.material.count({ where: whereClause }),
    ]);

    res.json({
      success: true,
      data: materials,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMaterialDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const material = await prisma.material.findUnique({
      where: { id: id as string },
    });

    if (!material) {
      res.status(404).json({ success: false, message: 'Material not found.' });
      return;
    }

    res.json({ success: true, data: material });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only teachers, principals, tutors, admins can post materials
    const { role } = req.user!;
    if (['student', 'parent'].includes(role.toLowerCase())) {
      res.status(403).json({ success: false, message: 'Access denied. You do not have permission to post materials.' });
      return;
    }

    const { title, type, fileUrl, subject, uploadedBy } = req.body;

    if (!title || !type || !fileUrl || !subject) {
      res.status(400).json({ success: false, message: 'title, type, fileUrl, and subject are required.' });
      return;
    }

    const newMaterial = await prisma.material.create({
      data: {
        title,
        type: type.toUpperCase(),
        fileUrl,
        subject,
        uploadedBy: uploadedBy || 'Staff Member',
      },
    });

    res.status(201).json({ success: true, data: newMaterial });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMaterial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role } = req.user!;
    if (['student', 'parent'].includes(role.toLowerCase())) {
      res.status(403).json({ success: false, message: 'Access denied. You do not have permission to delete materials.' });
      return;
    }

    const { id } = req.params;

    const material = await prisma.material.findUnique({
      where: { id: id as string },
    });

    if (!material) {
      res.status(404).json({ success: false, message: 'Material not found.' });
      return;
    }

    await prisma.material.delete({
      where: { id: id as string },
    });

    res.json({ success: true, message: 'Material deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
