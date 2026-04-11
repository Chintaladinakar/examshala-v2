import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import prisma from '../lib/prisma';

export const studentAccessGuard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  // Assume `protect` and `authorizeRoles('student')` have already run before this
  if (!req.user || req.user.role !== 'student') {
    res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      message: 'Access denied. Student role required.',
    });
    return;
  }

  const workspaceId = req.headers['x-workspace-id'] as string | undefined;

  // If a workspace context is provided, validate the student is actually a member of it.
  if (workspaceId) {
    try {
      const membership = await prisma.workspaceMembership.findUnique({
        where: {
          userId_workspaceId: {
            userId: req.user.userId,
            workspaceId: workspaceId
          }
        }
      });

      if (!membership) {
        res.status(403).json({
          success: false,
          code: 'FORBIDDEN_WORKSPACE',
          message: 'Access denied. You are not a member of this workspace.',
        });
        return;
      }
    } catch (error) {
      console.error('Error validating workspace membership:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while validating access.',
      });
      return;
    }
  }

  next();
};
