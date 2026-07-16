import prisma from '../lib/prisma';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_HOURS = 12;

type OTPType = 'SIGNUP_VERIFICATION' | 'PASSWORD_RESET';

function generateOTP(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let otp = '';
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return otp;
}

export async function sendOTP(email: string, type: OTPType): Promise<{ otp: string; expiresIn: number }> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Check if email is blocked due to max attempts
  const existingOTP = await prisma.oTP.findUnique({ where: { email } });

  if (existingOTP?.blockedUntil && existingOTP.blockedUntil > now) {
    throw {
      status: 429,
      code: 'OTP_BLOCKED',
      message: `Too many failed attempts. Please try again after ${existingOTP.blockedUntil.toLocaleTimeString()}`,
    };
  }

  const otp = generateOTP();

  // Upsert OTP record
  await prisma.oTP.upsert({
    where: { email },
    update: {
      code: otp,
      type,
      expiresAt,
      attemptCount: 0,
      blockedUntil: null,
      verifiedAt: null,
    },
    create: {
      email,
      code: otp,
      type,
      expiresAt,
    },
  });

  return { otp, expiresIn: OTP_EXPIRY_MINUTES * 60 };
}

export async function verifyOTP(email: string, code: string, type: OTPType): Promise<boolean> {
  const now = new Date();

  const otpRecord = await prisma.oTP.findUnique({ where: { email } });

  if (!otpRecord) {
    throw {
      status: 400,
      code: 'INVALID_OTP',
      message: 'OTP not found. Please request a new one.',
    };
  }

  // Check if blocked due to max attempts
  if (otpRecord.blockedUntil && otpRecord.blockedUntil > now) {
    throw {
      status: 429,
      code: 'OTP_BLOCKED',
      message: `Too many failed attempts. Please try again after ${otpRecord.blockedUntil.toLocaleTimeString()}`,
    };
  }

  // Check if OTP is expired
  if (otpRecord.expiresAt < now) {
    throw {
      status: 400,
      code: 'OTP_EXPIRED',
      message: 'OTP has expired. Please request a new one.',
    };
  }

  // Check if OTP type matches
  if (otpRecord.type !== type) {
    throw {
      status: 400,
      code: 'INVALID_OTP_TYPE',
      message: 'This OTP is not valid for this operation.',
    };
  }

  // Verify code (case-insensitive)
  if (otpRecord.code.toUpperCase() !== code.toUpperCase()) {
    // Increment attempt count
    const newAttemptCount = otpRecord.attemptCount + 1;
    let blockedUntil = null;

    if (newAttemptCount >= MAX_ATTEMPTS) {
      blockedUntil = new Date(now.getTime() + BLOCK_DURATION_HOURS * 60 * 60 * 1000);
    }

    await prisma.oTP.update({
      where: { email },
      data: {
        attemptCount: newAttemptCount,
        blockedUntil,
      },
    });

    const attemptsLeft = MAX_ATTEMPTS - newAttemptCount;
    throw {
      status: 400,
      code: 'INVALID_OTP',
      message: attemptsLeft > 0
        ? `Invalid OTP. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining.`
        : `Too many failed attempts. Please try again after ${blockedUntil?.toLocaleTimeString()}`,
    };
  }

  // OTP is valid, mark as verified
  await prisma.oTP.update({
    where: { email },
    data: { verifiedAt: now },
  });

  return true;
}

export async function getOTPStatus(email: string): Promise<{ isVerified: boolean; expiresAt: Date | null }> {
  const otp = await prisma.oTP.findUnique({ where: { email } });

  if (!otp) {
    return { isVerified: false, expiresAt: null };
  }

  return {
    isVerified: Boolean(otp.verifiedAt),
    expiresAt: otp.expiresAt,
  };
}

export async function deleteOTP(email: string): Promise<void> {
  await prisma.oTP.delete({ where: { email } }).catch(() => {});
}
