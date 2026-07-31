import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { Permission, roleHasPermission } from '../lib/permissions';

export const requirePermission = (permission: Permission) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!roleHasPermission(req.user?.role, permission)) {
      res.status(403).json({
        success: false,
        code: 'PERMISSION_DENIED',
        message: `Access denied. Missing permission: ${permission}.`,
      });
      return;
    }
    next();
  };
};
