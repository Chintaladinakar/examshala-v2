import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import { createSystemLog } from '../services/log.service';
import bcrypt from 'bcryptjs';

// -------------------------------------------------------------
// 1. USER CONTROLLERS
// -------------------------------------------------------------

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, status, search } = req.query;

    const where: any = {};
    
    if (role) {
      where.role = role as string;
    }
    
    if (status) {
      where.status = status as string;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        isActive: true,
        workspaceId: true,
        createdAt: true,
      }
    });

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const status = req.body.status as string; // ACTIVE, INACTIVE

    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
      res.status(400).json({
        success: false,
        code: 'INVALID_STATUS',
        message: 'Status must be ACTIVE or INACTIVE',
      });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
      return;
    }

    const isActive = status === 'ACTIVE';

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status,
        isActive,
      },
      select: { id: true, name: true, email: true, role: true, status: true, isActive: true },
    });

    // Audit Logging
    const actorId = req.user?.userId || 'system';
    await createSystemLog({
      userId: actorId,
      action: 'ROLE_ASSIGNED', // Toggling status/role mapping falls under this
      entity: 'USER',
      entityId: id,
      metadata: { email: user.email, status, action: 'STATUS_TOGGLED' },
    });

    res.status(200).json({
      success: true,
      message: `User status successfully set to ${status}`,
      data: updatedUser,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
};

// -------------------------------------------------------------
// 2. WORKSPACE CONTROLLERS
// -------------------------------------------------------------

export const getAllWorkspaces = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const workspaces = await prisma.workspace.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        memberships: {
          select: { userId: true },
        },
      },
    });

    // We need to fetch principal names manually or efficiently
    const principalIds = workspaces.map(w => w.principalId).filter(Boolean) as string[];
    const principals = await prisma.user.findMany({
      where: { id: { in: principalIds } },
      select: { id: true, name: true },
    });

    const principalMap = new Map(principals.map(p => [p.id, p.name]));

    const formattedWorkspaces = workspaces.map(w => ({
      id: w.id,
      name: w.name,
      status: w.status,
      createdBy: w.createdBy,
      principalId: w.principalId,
      principalName: w.principalId ? (principalMap.get(w.principalId) || 'Unknown') : 'Unassigned',
      userCount: w.memberships.length,
      createdAt: w.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: formattedWorkspaces,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
};

export const createWorkspace = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, principalId } = req.body;

    if (!name || name.trim() === '') {
      res.status(400).json({
        success: false,
        code: 'MISSING_NAME',
        message: 'Workspace name is required',
      });
      return;
    }

    const actorId = req.user?.userId || 'system';

    const workspace = await prisma.workspace.create({
      data: {
        name,
        createdBy: actorId,
        principalId: principalId || null,
      },
    });

    // If a principal was specified at creation, log the mapping membership
    if (principalId) {
      await prisma.workspaceMembership.create({
        data: {
          userId: principalId,
          workspaceId: workspace.id,
          role: 'principal',
        },
      });
    }

    // Audit Logging
    await createSystemLog({
      userId: actorId,
      action: 'WORKSPACE_CREATED',
      entity: 'WORKSPACE',
      entityId: workspace.id,
      metadata: { name: workspace.name, principalId },
    });

    res.status(201).json({
      success: true,
      message: 'Workspace created successfully',
      data: workspace,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
};

export const assignPrincipal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string; // Workspace ID
    const principalId = req.body.principalId as string;

    if (!principalId) {
      res.status(400).json({
        success: false,
        code: 'MISSING_PRINCIPAL_ID',
        message: 'Principal ID is required',
      });
      return;
    }

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) {
      res.status(404).json({
        success: false,
        code: 'WORKSPACE_NOT_FOUND',
        message: 'Workspace not found',
      });
      return;
    }

    const principal = await prisma.user.findUnique({ where: { id: principalId } });
    if (!principal || principal.role !== 'PRINCIPAL') {
      res.status(400).json({
        success: false,
        code: 'INVALID_PRINCIPAL',
        message: 'Assigned user must exist and have the PRINCIPAL role',
      });
      return;
    }

    const updatedWorkspace = await prisma.workspace.update({
      where: { id },
      data: { principalId },
    });

    // Upsert membership for this principal inside the workspace
    await prisma.workspaceMembership.upsert({
      where: {
        userId_workspaceId: { userId: principalId, workspaceId: id },
      },
      update: { role: 'principal' },
      create: {
        userId: principalId,
        workspaceId: id,
        role: 'principal',
      },
    });

    // Update user's workspaceId column to match (since a user can have a primary workspaceId)
    await prisma.user.update({
      where: { id: principalId },
      data: { workspaceId: id },
    });

    // Audit Logging
    const actorId = req.user?.userId || 'system';
    await createSystemLog({
      userId: actorId,
      action: 'ROLE_ASSIGNED',
      entity: 'USER',
      entityId: principalId,
      metadata: { role: 'PRINCIPAL', workspaceId: id, workspaceName: workspace.name },
    });

    res.status(200).json({
      success: true,
      message: `Successfully assigned Principal ${principal.name} to Workspace ${workspace.name}`,
      data: updatedWorkspace,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
};

// -------------------------------------------------------------
// 3. INVITATION CONTROLLERS
// -------------------------------------------------------------

export const getAllInvites = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invites = await prisma.invite.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: invites,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
};

export const sendInvite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, role, workspaceId } = req.body;

    if (!email || !role) {
      res.status(400).json({
        success: false,
        code: 'MISSING_FIELDS',
        message: 'Email and role are required',
      });
      return;
    }

    const validRoles = ['ORG_ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT'];
    if (!validRoles.includes(role)) {
      res.status(400).json({
        success: false,
        code: 'INVALID_ROLE',
        message: `Role must be one of: ${validRoles.join(', ')}`,
      });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({
        success: false,
        code: 'USER_EXISTS',
        message: 'A user with this email address already exists in the system',
      });
      return;
    }

    const actorId = req.user?.userId || 'system';

    // Create invite record
    const invite = await prisma.invite.create({
      data: {
        email,
        role,
        workspaceId: workspaceId || null,
        status: 'PENDING',
      },
    });

    // Initialize an INVITED user in inactive state so they can register later
    const defaultPassword = process.env.INVITE_DEFAULT_PASSWORD || 'ExamshalaInvited@123';
    const passwordHash = await bcrypt.hash(defaultPassword, 12);
    const pendingUser = await prisma.user.create({
      data: {
        name: email.split('@')[0],
        email,
        passwordHash,
        role,
        status: 'INVITED',
        isActive: false, // Inactive until registered/accepted
        workspaceId: workspaceId || null,
      },
    });

    // If workspace was provided, create an initial membership record
    if (workspaceId) {
      await prisma.workspaceMembership.create({
        data: {
          userId: pendingUser.id,
          workspaceId,
          role: role.toLowerCase(),
        },
      });
    }

    // Audit Logging
    await createSystemLog({
      userId: actorId,
      action: 'INVITE_SENT',
      entity: 'INVITE',
      entityId: invite.id,
      metadata: { email, role, workspaceId },
    });

    await createSystemLog({
      userId: actorId,
      action: 'USER_CREATED',
      entity: 'USER',
      entityId: pendingUser.id,
      metadata: { email, role, status: 'INVITED' },
    });

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: invite,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
};

// -------------------------------------------------------------
// 4. LOG CONTROLLERS
// -------------------------------------------------------------

export const getAllLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, action, entity } = req.query;

    const where: any = {};

    if (userId) {
      where.userId = userId as string;
    }

    if (action) {
      where.action = action as string;
    }

    if (entity) {
      where.entity = entity as string;
    }

    const logs = await prisma.log.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200, // safety cap
    });

    // Populate user names for readability
    const userIds = Array.from(new Set(logs.map(l => l.userId))).filter(Boolean);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    const formattedLogs = logs.map(l => {
      const user = userMap.get(l.userId);
      return {
        id: l.id,
        userId: l.userId,
        userName: user ? user.name : 'System/Unknown',
        userEmail: user ? user.email : '',
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        metadata: l.metadata,
        createdAt: l.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedLogs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }
};

// Legacy support
export const assignRoleController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      res.status(400).json({ success: false, code: 'MISSING_FIELDS', message: 'Email and role are required' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role },
    });

    const actorId = req.user?.userId || 'system';
    await createSystemLog({
      userId: actorId,
      action: 'ROLE_ASSIGNED',
      entity: 'USER',
      entityId: updatedUser.id,
      metadata: { email, role },
    });

    res.status(200).json({ success: true, message: `Successfully assigned role '${role}' to ${email}`, data: updatedUser });
  } catch (error: any) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message || 'Internal server error' });
  }
};

export const getAdminProfile = async (req: AuthRequest, res: Promise<any> | any): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Not logged in' });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, status: true }
    });
    if (!user) {
      res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'User not found' });
      return;
    }
    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message || 'Internal server error' });
  }
};

