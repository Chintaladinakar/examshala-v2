import { Router } from 'express';
import {
  signupController,
  signinController,
  resetPasswordController,
  forgotPasswordController,
  resetPasswordWithTokenController,
  refreshTokenController,
  logoutController,
  logoutAllController,
  requestSignupOTPController,
  verifySignupOTPController,
  requestPasswordResetOTPController,
  verifyPasswordResetOTPController
} from '../controllers/auth.controller';
import { authRateLimiter, otpRequestRateLimiter } from '../middleware/rateLimit.middleware';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/signup', authRateLimiter, signupController);
router.post('/signin', authRateLimiter, signinController);
router.post('/reset-password', authRateLimiter, resetPasswordController);
router.post('/forgot-password', authRateLimiter, forgotPasswordController);
router.post('/reset-password-with-token', authRateLimiter, resetPasswordWithTokenController);
router.post('/refresh', authRateLimiter, refreshTokenController);
router.post('/logout', logoutController);
router.post('/logout-all', protect, logoutAllController);

// OTP routes
router.post('/request-signup-otp', otpRequestRateLimiter, requestSignupOTPController);
router.post('/verify-signup-otp', authRateLimiter, verifySignupOTPController);
router.post('/request-password-reset-otp', otpRequestRateLimiter, requestPasswordResetOTPController);
router.post('/verify-password-reset-otp', authRateLimiter, verifyPasswordResetOTPController);

export default router;
