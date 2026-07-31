import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import prisma from '../lib/prisma';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    let token: string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.session_token) {
      token = req.cookies.session_token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        code: 'NO_TOKEN',
        message: 'Access denied. No token provided.',
      });
      return;
    }

    const decoded = verifyToken(token);

    // Dynamic check: Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isActive: true, workspaceId: true, role: true }
    });

    if (!user) {
      res.status(401).json({ success: false, code: 'USER_NOT_FOUND', message: 'User no longer exists.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        code: 'ACCOUNT_DISABLED',
        message: 'Your account has been disabled. Please contact support.',
      });
      return;
    }

    if (user.role.toLowerCase() !== 'org_admin' && user.workspaceId) {
      const workspace = await prisma.workspace.findUnique({
        where: { id: user.workspaceId },
        select: { status: true },
      });
      if (workspace?.status === 'SUSPENDED') {
        res.status(403).json({
          success: false,
          code: 'WORKSPACE_SUSPENDED',
          message: 'This workspace has been suspended. Please contact the administrator.',
        });
        return;
      }
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Invalid or expired token.',
    });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Access denied. You do not have the required permissions.',
      });
      return;
    }
    next();
  };
};
