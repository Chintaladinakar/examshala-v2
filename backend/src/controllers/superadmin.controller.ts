import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const [totalUsers, totalWorkspaces, totalResults, recentUsers, recentWorkspaces, sessionCount] = await Promise.all([
      prisma.user.count(),
      prisma.workspace.count(),
      prisma.assessmentResult.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, createdAt: true, isActive: true }
      }),
      prisma.workspace.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { memberships: true } } }
      }),
      prisma.user.count({ where: { isActive: true } })
    ]);

    const formattedWorkspaces = recentWorkspaces.map(w => ({
      id: w.id,
      name: w.name,
      createdAt: w.createdAt,
      userCount: w._count.memberships
    }));

    res.json({
      success: true,
      data: {
        totalUsers,
        totalWorkspaces,
        totalResults,
        activeSessions: sessionCount,
        recentUsers,
        recentWorkspaces: formattedWorkspaces
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const [totalUsers, totalWorkspaces, sessionCount] = await Promise.all([
      prisma.user.count(),
      prisma.workspace.count(),
      prisma.user.count({ where: { isActive: true } })
    ]);

    res.json({
      success: true,
      data: { totalUsers, totalWorkspaces, activeSessions: sessionCount }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecentUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true, isActive: true }
    });
    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecentWorkspaces = async (req: Request, res: Response) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { memberships: true } } }
    });
    const formatted = workspaces.map(w => ({
      id: w.id,
      name: w.name,
      createdAt: w.createdAt,
      userCount: w._count.memberships
    }));
    res.json({ success: true, data: formatted });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true, isActive: true }
    });
    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : '';
    if (!id) return res.status(400).json({ success: false, message: 'User id is required' });
    const { isActive } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, isActive: true }
    });
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : '';
    if (!id) return res.status(400).json({ success: false, message: 'User id is required' });
    const { role } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, role: true }
    });
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllWorkspaces = async (req: Request, res: Response) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { memberships: true } } }
    });
    const formatted = workspaces.map(w => ({
      id: w.id,
      name: w.name,
      createdAt: w.createdAt,
      userCount: w._count.memberships,
      status: w.status
    }));
    res.json({ success: true, data: formatted });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createWorkspace = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    /**
     * Generates a unique, short, and brand-consistent 8-character Workspace ID.
     * The ID is prefixed with 'ES-' (Examshala) followed by 5 random uppercase letters/numbers.
     * Exposes a user-friendly mnemonic code (e.g. ES-6MCED) instead of long UUID database keys,
     * protecting DB schema privacy and making it extremely easy for users to type and share.
     * Alphanumeric characters exclude highly confusing ones like 0, O, I, 1, and L to ensure
     * ease of reading and typing.
     */
    const generateWorkspaceId = async (): Promise<string> => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let attempts = 0;
      while (attempts < 50) {
        let code = 'ES-';
        for (let i = 0; i < 5; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const existing = await prisma.workspace.findUnique({ where: { id: code } });
        if (!existing) return code;
        attempts++;
      }
      return `ES-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    };
    const workspaceId = await generateWorkspaceId();

    const workspace = await prisma.workspace.create({
      data: {
        id: workspaceId,
        name,
      },
    });
    res.status(201).json({ success: true, data: workspace });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteWorkspace = async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : '';
    if (!id) return res.status(400).json({ success: false, message: 'Workspace id is required' });
    await prisma.workspace.delete({ where: { id } });
    res.json({ success: true, message: 'Workspace deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllResults = async (req: Request, res: Response) => {
  try {
    const results = await prisma.assessmentResult.findMany({
      orderBy: { evaluatedAt: 'desc' },
      include: {
        Attempt: {
          include: {
            User: { select: { name: true } },
            Assignment: {
              include: {
                Test: { select: { title: true } },
                Workspace: { select: { name: true } }
              }
            }
          }
        }
      }
    });
    const formatted = results.map(r => ({
      id: r.id,
      studentName: r.Attempt.User.name,
      examTitle: r.Attempt.Assignment?.Test?.title || 'Unknown Exam',
      workspaceName: r.Attempt.Assignment?.Workspace?.name || 'Unknown Workspace',
      score: r.score,
      maxScore: r.maxScore,
      status: r.Attempt.status,
      evaluatedAt: r.evaluatedAt
    }));
    res.json({ success: true, data: formatted });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPlatformSettings = async (req: Request, res: Response) => {
  try {
    let settings = await prisma.platformSettings.findUnique({ where: { id: 'global-settings' } });
    if (!settings) {
      settings = await prisma.platformSettings.create({ data: { id: 'global-settings' } });
    }
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePlatformSettings = async (req: Request, res: Response) => {
  try {
    const { platformName, supportEmail } = req.body;
    const settings = await prisma.platformSettings.upsert({
      where: { id: 'global-settings' },
      update: { platformName, supportEmail },
      create: { id: 'global-settings', platformName, supportEmail }
    });
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
