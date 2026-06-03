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

  const user = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
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
