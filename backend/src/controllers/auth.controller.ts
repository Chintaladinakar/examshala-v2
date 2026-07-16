import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import * as otpService from "../services/otp.service";
import { sendOTPEmail } from "../services/mail.service";

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

    console.log(
      `[auth] ${result.user.role} signed in: ${result.user.email} via ${loginMethod}`,
    );
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
