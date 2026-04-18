import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const [totalUsers, totalWorkspaces, recentUsers, recentWorkspaces] = await Promise.all([
      prisma.user.count(),
      prisma.workspace.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, createdAt: true, isActive: true }
      }),
      prisma.workspace.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { memberships: true } } }
      })
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
        activeSessions: Math.floor(Math.random() * 200) + 50, // Mocked as per earlier logic
        recentUsers,
        recentWorkspaces: formattedWorkspaces
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get counts for dashboard cards
export const getStats = async (req: Request, res: Response) => {
  try {
    const [totalUsers, totalWorkspaces, activeSessions] = await Promise.all([
      prisma.user.count(),
      prisma.workspace.count(),
      // Mocking active sessions since we don't have a sessions table, 
      // but in a real app this would query a Redis store or a Sessions table.
      Promise.resolve(Math.floor(Math.random() * 200) + 50) 
    ]);

    res.json({
      success: true,
      data: { totalUsers, totalWorkspaces, activeSessions }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get last 5 users
export const getRecentUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        isActive: true
      }
    });
    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get last 5 workspaces
export const getRecentWorkspaces = async (req: Request, res: Response) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { memberships: true }
        }
      }
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

// Get all users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        isActive: true
      }
    });
    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user status
export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
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

// Update user role
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
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

// Get all workspaces
export const getAllWorkspaces = async (req: Request, res: Response) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { memberships: true }
        }
      }
    });

    const formatted = workspaces.map(w => ({
      id: w.id,
      name: w.name,
      createdAt: w.createdAt,
      userCount: w._count.memberships,
      status: 'active' // Adding a static status for now
    }));

    res.json({ success: true, data: formatted });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create workspace
export const createWorkspace = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    const workspace = await prisma.workspace.create({
      data: { name }
    });

    res.status(201).json({ success: true, data: workspace });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete workspace
export const deleteWorkspace = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.workspace.delete({ where: { id } });
    res.json({ success: true, message: 'Workspace deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all results
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
      examTitle: r.Attempt.Assignment.Test.title,
      workspaceName: r.Attempt.Assignment.Workspace.name,
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
