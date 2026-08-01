import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import * as otpService from "../services/otp.service";
import { sendOTPEmail } from "../services/mail.service";
import { AuthRequest } from "../middleware/auth.middleware";
import logger from "../lib/logger";

export const signupController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;
    const result = await authService.signup({ name, email, password, role });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: result,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || "Internal server error";
    const code = error.code || "SERVER_ERROR";

    res.status(status).json({
      success: false,
      code,
      message,
    });
  }
};

export const signinController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const loginMethod = password ? "password" : "unknown";
    const result = await authService.signin({ email, password });

    logger.info({ role: result.user.role, email: result.user.email, loginMethod }, 'user signed in');
    res.status(200).json({
      success: true,
      message: "Signed in successfully",
      data: result,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || "Internal server error";
    const code = error.code || "SERVER_ERROR";

    res.status(status).json({
      success: false,
      code,
      message,
    });
  }
};

export const resetPasswordController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const result = await authService.resetPassword({ email, currentPassword, newPassword });

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
      data: result,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || "Internal server error";
    const code = error.code || "SERVER_ERROR";

    res.status(status).json({
      success: false,
      code,
      message,
    });
  }
};

export const forgotPasswordController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword({ email });

    res.status(200).json({
      success: true,
      message: "If a user with this email exists, a password reset link has been generated.",
      data: result,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || "Internal server error";
    const code = error.code || "SERVER_ERROR";

    res.status(status).json({
      success: false,
      code,
      message,
    });
  }
};

export const resetPasswordWithTokenController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { token, password } = req.body;
    const result = await authService.resetPasswordWithToken({ token, password });

    res.status(200).json({
      success: true,
      message: "Password reset successfully.",
      data: result,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || "Internal server error";
    const code = error.code || "SERVER_ERROR";

    res.status(status).json({
      success: false,
      code,
      message,
    });
  }
};

export const refreshTokenController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken({ refreshToken });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || "Internal server error";
    const code = error.code || "SERVER_ERROR";

    res.status(status).json({
      success: false,
      code,
      message,
    });
  }
};

export const logoutController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    await authService.revokeRefreshToken({ refreshToken });

    res.status(200).json({
      success: true,
      message: "Signed out successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const logoutAllController = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    await authService.revokeAllRefreshTokens({ userId });

    res.status(200).json({
      success: true,
      message: "Signed out of all devices",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// OTP Controllers
export const requestSignupOTPController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        code: 'MISSING_EMAIL',
        message: 'Email is required',
      });
      return;
    }

    const { otp, expiresIn } = await otpService.sendOTP(email, 'SIGNUP_VERIFICATION');

    await sendOTPEmail(email, otp, 'SIGNUP');

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email',
      data: { expiresIn },
    });
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    const code = error.code || 'SERVER_ERROR';

    res.status(status).json({
      success: false,
      code,
      message,
    });
  }
};

export const verifySignupOTPController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({
        success: false,
        code: 'MISSING_FIELDS',
        message: 'Email and OTP are required',
      });
      return;
    }

    await otpService.verifyOTP(email, otp, 'SIGNUP_VERIFICATION');

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    const code = error.code || 'SERVER_ERROR';

    res.status(status).json({
      success: false,
      code,
      message,
    });
  }
};

export const requestPasswordResetOTPController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        code: 'MISSING_EMAIL',
        message: 'Email is required',
      });
      return;
    }

    const { otp, expiresIn } = await otpService.sendOTP(email, 'PASSWORD_RESET');

    await sendOTPEmail(email, otp, 'PASSWORD_RESET');

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email for password reset',
      data: { expiresIn },
    });
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    const code = error.code || 'SERVER_ERROR';

    res.status(status).json({
      success: false,
      code,
      message,
    });
  }
};

export const verifyPasswordResetOTPController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({
        success: false,
        code: 'MISSING_FIELDS',
        message: 'Email and OTP are required',
      });
      return;
    }

    await otpService.verifyOTP(email, otp, 'PASSWORD_RESET');

    res.status(200).json({
      success: true,
      message: 'OTP verified. You can now reset your password.',
    });
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || 'Internal server error';
    const code = error.code || 'SERVER_ERROR';

    res.status(status).json({
      success: false,
      code,
      message,
    });
  }
};
