import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { generateToken } from '../lib/jwt';

interface SignupInput {
  name: string;
  email: string;
  password: string;
  role?: string;
}

interface SigninInput {
  email: string;
  password: string;
}

export const signup = async ({ name, email, password, role }: SignupInput) => {
  if (!name || !email || !password) {
    throw { status: 400, code: 'MISSING_FIELDS', message: 'Name, email, and password are required' };
  }

  const validRole = role === 'tutor' ? 'tutor' : 'student';

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw { status: 409, code: 'EMAIL_EXISTS', message: 'A user with this email already exists' };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  /**
   * Generates a unique, short, and brand-consistent 8-character User ID.
   * Instead of exposing standard raw database UUIDs, this format enhances security/privacy
   * and provides user-friendly mnemonic identifiers based on the user's role:
   *  - Students: ST-XXXXX (e.g. ST-Y3M8P)
   *  - Teachers/Tutors: TR-XXXXX (e.g. TR-K9W2D)
   *  - Principals: PR-XXXXX (e.g. PR-SMITH)
   *  - Admins: AD-XXXXX (e.g. AD-ADMIN)
   * 
   * The alphanumeric block excludes confusing characters (like 0, O, I, 1, L) for legibility.
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
  const userId = await generateFancyUserId(validRole);

  const user = await prisma.user.create({
    data: {
      id: userId,
      name,
      email,
      passwordHash,
      role: validRole,
      firstLogin: false,
    },
  });

  const token = generateToken({ userId: user.id, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      firstLogin: user.firstLogin,
    },
  };
};

export const signin = async ({ email, password }: SigninInput) => {
  if (!email || !password) {
    throw { status: 400, code: 'MISSING_FIELDS', message: 'Email and password are required' };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw { status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash || "");
  if (!isPasswordValid) {
    throw { status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
  }

  const token = generateToken({ userId: user.id, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      firstLogin: user.firstLogin,
    },
  };
};

export const resetPassword = async ({ email, currentPassword, newPassword }: any) => {
  if (!email || !currentPassword || !newPassword) {
    throw { status: 400, code: 'MISSING_FIELDS', message: 'Email, current password, and new password are required' };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw { status: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash || "");
  if (!isPasswordValid) {
    throw { status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid current password' };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      passwordHash,
      firstLogin: false,
    },
  });

  const token = generateToken({ userId: updatedUser.id, role: updatedUser.role });

  return {
    token,
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      firstLogin: updatedUser.firstLogin,
    },
  };
};
