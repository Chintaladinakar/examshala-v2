import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { generateToken, JWT_SECRET } from '../lib/jwt';
import jwt from 'jsonwebtoken';
import { validatePassword } from '../lib/password-policy';
import * as otpService from './otp.service';
import { isMailConfigured, sendPasswordResetEmail } from './mail.service';

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

  // Enforce shared password policy (same rules applied everywhere in auth flows).
  const pwCheck = validatePassword(password);
  if (!pwCheck.valid) {
    throw { status: 400, code: 'INVALID_PASSWORD', message: pwCheck.message };
  }

  const validRole = role === 'tutor' ? 'tutor' : 'student';

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw { status: 409, code: 'EMAIL_EXISTS', message: 'A user with this email already exists' };
  }

  // Require a verified signup OTP before the account can be created.
  const otpStatus = await otpService.getOTPStatus(email);
  if (!otpStatus.isVerified) {
    throw {
      status: 403,
      code: 'EMAIL_NOT_VERIFIED',
      message: 'Please verify your email with the OTP sent to you before creating an account',
    };
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
    else if (roleLower === 'org_admin') prefix = 'AD-';

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
      isActive: true,
      firstLogin: false,
    },
  });

  await otpService.deleteOTP(email);

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

  // An admin-disabled account (explicitly set to INACTIVE) must stay disabled through a
  // password change — only accounts still pending first-time activation (INVITED) or
  // already ACTIVE may be (re)activated here.
  if (user.status === 'INACTIVE') {
    throw { status: 403, code: 'ACCOUNT_DISABLED', message: 'Your account has been disabled. Please contact support.' };
  }

  // Enforce the same shared password policy used everywhere else.
  const pwCheck = validatePassword(newPassword);
  if (!pwCheck.valid) {
    throw { status: 400, code: 'INVALID_PASSWORD', message: pwCheck.message };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      passwordHash,
      isActive: true,
      status: 'ACTIVE',
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

/**
 * Initiates the password reset process by generating a signed JWT token.
 * The token's signing key includes the user's current password hash,
 * rendering the token single-use once the password is successfully updated.
 */
export const forgotPassword = async ({ email }: { email: string }) => {
  if (!email) {
    throw { status: 400, code: 'MISSING_FIELDS', message: 'Email is required' };
  }

  // Always return the same generic response regardless of whether the email is registered,
  // so this endpoint can't be used to enumerate which email addresses have accounts.
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (user) {
    const secret = JWT_SECRET + (user.passwordHash || '');
    const token = jwt.sign({ email: user.email }, secret, { expiresIn: '1h' });

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const resetLink = `${appUrl.replace(/\/$/, '')}/reset-password-with-token?token=${encodeURIComponent(token)}`;

    if (isMailConfigured()) {
      await sendPasswordResetEmail(user.email, resetLink);
    } else if (process.env.NODE_ENV !== 'production') {
      console.log('\n----------------------------------------');
      console.log(`[auth] Password reset requested for: ${user.email}`);
      console.log(`[auth] Mail not configured — Dev Reset Link: ${resetLink}`);
      console.log('----------------------------------------\n');
    }
  }

  return {
    success: true,
  };
};

/**
 * Resets a user's password using a valid, unexpired reset token.
 * Validates token signature dynamically based on the current password hash.
 */
export const resetPasswordWithToken = async ({ token, password }: any) => {
  if (!token || !password) {
    throw { status: 400, code: 'MISSING_FIELDS', message: 'Token and new password are required' };
  }

  // Enforce the same shared password policy used at signup.
  const pwCheck = validatePassword(password);
  if (!pwCheck.valid) {
    throw { status: 400, code: 'INVALID_PASSWORD', message: pwCheck.message };
  }

  // 1. Decode token to find email
  let decoded: any;
  try {
    decoded = jwt.decode(token);
  } catch (err) {
    throw { status: 400, code: 'INVALID_TOKEN', message: 'Invalid token format' };
  }

  if (!decoded || !decoded.email) {
    throw { status: 400, code: 'INVALID_TOKEN', message: 'Invalid reset token payload' };
  }

  // 2. Fetch user
  const user = await prisma.user.findUnique({ where: { email: decoded.email } });
  if (!user) {
    throw { status: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
  }

  // 3. Verify token with user's dynamic secret
  const secret = JWT_SECRET + (user.passwordHash || '');

  try {
    jwt.verify(token, secret);
  } catch (err: any) {
    throw { status: 400, code: 'TOKEN_EXPIRED', message: 'Reset token is invalid or has expired' };
  }

  // 4. Hash new password and update user record
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      isActive: true, // Activate account during password reset
      firstLogin: false, // Reset password establishes credentials
    },
  });

  return {
    success: true,
  };
};
