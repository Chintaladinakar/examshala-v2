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
        memberships: {
          select: {
            workspaceId: true,
          },
        },
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

export const editUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, email, role, workspaceId, workspaceIds, status } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
      return;
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) {
      if (email !== user.email) {
        const emailExists = await prisma.user.findUnique({ where: { email } });
        if (emailExists) {
          res.status(400).json({
            success: false,
            code: 'EMAIL_IN_USE',
            message: 'Email address already in use by another user',
          });
          return;
        }
      }
      updateData.email = email;
    }
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) {
      updateData.status = status;
      updateData.isActive = status === 'ACTIVE';
    }

    let activeWorkspaceId = workspaceId;
    if (Array.isArray(workspaceIds)) {
      activeWorkspaceId = workspaceIds[0] || null;
    }

    if (activeWorkspaceId !== undefined) {
      updateData.workspaceId = activeWorkspaceId || null;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    if (Array.isArray(workspaceIds)) {
      // 1. Delete memberships no longer assigned
      await prisma.workspaceMembership.deleteMany({
        where: {
          userId: id,
          workspaceId: { notIn: workspaceIds },
        },
      });

      // 2. Upsert memberships for selected workspaces
      for (const wsId of workspaceIds) {
        await prisma.workspaceMembership.upsert({
          where: {
            userId_workspaceId: { userId: id, workspaceId: wsId },
          },
          update: { role: (role || user.role).toLowerCase() },
          create: {
            userId: id,
            workspaceId: wsId,
            role: (role || user.role).toLowerCase(),
          },
        });
      }
    } else if (workspaceId !== undefined) {
      if (workspaceId) {
        await prisma.workspaceMembership.upsert({
          where: {
            userId_workspaceId: { userId: id, workspaceId },
          },
          update: { role: (role || user.role).toLowerCase() },
          create: {
            userId: id,
            workspaceId,
            role: (role || user.role).toLowerCase(),
          },
        });
      } else if (user.workspaceId) {
        await prisma.workspaceMembership.deleteMany({
          where: { userId: id, workspaceId: user.workspaceId },
        });
      }
    }

    if (role !== undefined && role !== 'PRINCIPAL') {
      await prisma.workspace.updateMany({
        where: { principalId: id },
        data: { principalId: null },
      });
    }

    const actorId = req.user?.userId || 'system';
    await createSystemLog({
      userId: actorId,
      action: 'ROLE_ASSIGNED',
      entity: 'USER',
      entityId: id,
      metadata: { email: updatedUser.email, name, role, workspaceId, status, action: 'USER_EDITED' },
    });

    res.status(200).json({
      success: true,
      message: 'User details updated successfully',
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

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
      return;
    }

    await prisma.workspace.updateMany({
      where: { principalId: id },
      data: { principalId: null },
    });

    await prisma.parentStudentLink.deleteMany({
      where: { parentUserId: id },
    });

    await prisma.user.delete({
      where: { id },
    });

    const actorId = req.user?.userId || 'system';
    await createSystemLog({
      userId: actorId,
      action: 'ROLE_ASSIGNED',
      entity: 'USER',
      entityId: id,
      metadata: { email: user.email, name: user.name, action: 'USER_DELETED' },
    });

    res.status(200).json({
      success: true,
      message: 'User deleted and removed from the system successfully',
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
    const { email, role, workspaceId, workspaceIds } = req.body;

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

    let activeWorkspaceId = workspaceId;
    let finalWorkspaceIds: string[] = [];
    if (Array.isArray(workspaceIds)) {
      activeWorkspaceId = workspaceIds[0] || null;
      finalWorkspaceIds = workspaceIds;
    } else if (workspaceId) {
      finalWorkspaceIds = [workspaceId];
    }

    // Initialize an INVITED user in inactive state so they can register later
    const defaultPassword = process.env.INVITE_DEFAULT_PASSWORD || 'ExamshalaInvited@123';
    const passwordHash = await bcrypt.hash(defaultPassword, 12);
    /**
     * Generates a unique, short, and brand-consistent 8-character User ID.
     * Combines a role-specific prefix (e.g. TR- for teachers, ST- for students, PR- for principals)
     * with a random 5-character alphanumeric block for maximum user readability and privacy.
     * Alphanumeric characters exclude highly confusing ones like 0, O, I, 1, and L to ensure
     * legibility when sharing.
     */
    const generateFancyUserId = async (userRole: string): Promise<string> => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let prefix = 'US-';
      const roleLower = userRole.toLowerCase();
      if (roleLower === 'student') prefix = 'ST-';
      else if (roleLower === 'tutor' || roleLower === 'teacher') prefix = 'TR-';
      else if (roleLower === 'principal') prefix = 'PR-';
      else if (roleLower === 'superadmin' || roleLower === 'org_admin' || roleLower === 'admin') prefix = 'AD-';

      let attempts = 0;
      while (attempts < 50) {
        let code = prefix;
        for (let i = 0; i < 5; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const existing = await prisma.user.findUnique({ where: { id: code } });
        if (!existing) return code;
        attempts++;
      }
      return `${prefix}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    };
    const userId = await generateFancyUserId(role);

    const pendingUser = await prisma.user.create({
      data: {
        id: userId,
        name: email.split('@')[0],
        email,
        passwordHash,
        role,
        status: 'INVITED',
        isActive: false, // Inactive until registered/accepted
        workspaceId: activeWorkspaceId || null,
      },
    });

    // Create memberships
    if (finalWorkspaceIds.length > 0) {
      for (const wsId of finalWorkspaceIds) {
        await prisma.workspaceMembership.create({
          data: {
            userId: pendingUser.id,
            workspaceId: wsId,
            role: role.toLowerCase(),
          },
        });
      }
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
      data: {
        ...invite,
        password: defaultPassword,
      },
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

export const editWorkspace = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, principalId } = req.body;

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) {
      res.status(404).json({ success: false, code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' });
      return;
    }

    const updated = await prisma.workspace.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        principalId: principalId !== undefined ? (principalId || null) : undefined,
      },
    });

    // Update workspaceMembership if principalId changed
    if (principalId !== undefined) {
      await prisma.workspaceMembership.deleteMany({
        where: {
          workspaceId: id,
          role: 'principal',
        },
      });

      if (principalId) {
        await prisma.workspaceMembership.create({
          data: {
            userId: principalId,
            workspaceId: id,
            role: 'principal',
          },
        });
      }
    }

    // Audit Logging
    const actorId = req.user?.userId || 'system';
    await createSystemLog({
      userId: actorId,
      action: 'WORKSPACE_UPDATED',
      entity: 'WORKSPACE',
      entityId: id,
      metadata: { name: updated.name, principalId },
    });

    res.status(200).json({ success: true, message: 'Workspace updated successfully', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message || 'Internal server error' });
  }
};

export const deleteWorkspace = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) {
      res.status(404).json({ success: false, code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' });
      return;
    }

    await prisma.workspace.delete({ where: { id } });

    // Audit Logging
    const actorId = req.user?.userId || 'system';
    await createSystemLog({
      userId: actorId,
      action: 'WORKSPACE_DELETED',
      entity: 'WORKSPACE',
      entityId: id,
      metadata: { name: workspace.name },
    });

    res.status(200).json({ success: true, message: 'Workspace deleted successfully' });
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

