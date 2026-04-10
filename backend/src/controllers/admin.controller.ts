import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const assignRoleController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      res.status(400).json({
        success: false,
        code: 'MISSING_FIELDS',
        message: 'Email and role are required',
      });
      return;
    }

    const permittedRoles = ['student', 'tutor', 'principal', 'admin'];
    if (!permittedRoles.includes(role)) {
      res.status(400).json({
        success: false,
        code: 'INVALID_ROLE',
        message: `Role must be one of: ${permittedRoles.join(', ')}`,
      });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'No user found with this email address',
      });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    res.status(200).json({
      success: true,
      message: `Successfully assigned role '${role}' to ${email}`,
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
