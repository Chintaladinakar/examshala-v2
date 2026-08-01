import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import prisma from '../lib/prisma';
import { cached } from '../lib/redis';
import { tenantContext } from '../lib/tenantContext';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

interface AuthState {
  isActive: boolean;
  workspaceId: string | null;
  role: string;
  workspaceStatus: string | null;
}

// This runs on every authenticated request, so it's the single hottest DB round-trip in the
// app — under real concurrency it's two SELECTs (user, then workspace) per request purely to
// check "is this account/workspace still allowed to be here". An 8s cache trades a small
// window of staleness (an admin disabling an account can take up to ~8s to take effect instead
// of being instant) for cutting that off the request's critical path almost entirely; degrades
// to hitting the DB directly (today's behavior) whenever Redis isn't configured/reachable.
async function loadAuthState(userId: string): Promise<AuthState | null> {
  return cached<AuthState | null>(`auth:state:${userId}`, 8, async () => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true, workspaceId: true, role: true },
    });
    if (!user) return null;

    let workspaceStatus: string | null = null;
    if (user.role.toLowerCase() !== 'org_admin' && user.workspaceId) {
      const workspace = await prisma.workspace.findUnique({
        where: { id: user.workspaceId },
        select: { status: true },
      });
      workspaceStatus = workspace?.status ?? null;
    }

    return { isActive: user.isActive, workspaceId: user.workspaceId, role: user.role, workspaceStatus };
  });
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

    // Dynamic check: Verify user still exists and is active (Redis-cached — see loadAuthState).
    const user = await loadAuthState(decoded.userId);

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

    if (user.workspaceStatus === 'SUSPENDED') {
      res.status(403).json({
        success: false,
        code: 'WORKSPACE_SUSPENDED',
        message: 'This workspace has been suspended. Please contact the administrator.',
      });
      return;
    }

    req.user = decoded;
    // Scopes every Prisma query made for the rest of this request to the caller's workspace
    // (see lib/tenantContext.ts + the Prisma extension in lib/prisma.ts) as a defense-in-depth
    // backstop on top of each controller's own explicit workspace checks.
    tenantContext.run({ workspaceId: user.workspaceId }, () => next());
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
