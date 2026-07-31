import { Router } from 'express';
import {
  signupController,
  signinController,
  resetPasswordController,
  forgotPasswordController,
  resetPasswordWithTokenController,
  requestSignupOTPController,
  verifySignupOTPController,
  requestPasswordResetOTPController,
  verifyPasswordResetOTPController
} from '../controllers/auth.controller';
import { authRateLimiter, otpRequestRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/signup', authRateLimiter, signupController);
router.post('/signin', authRateLimiter, signinController);
router.post('/reset-password', authRateLimiter, resetPasswordController);
router.post('/forgot-password', authRateLimiter, forgotPasswordController);
router.post('/reset-password-with-token', authRateLimiter, resetPasswordWithTokenController);

// OTP routes
router.post('/request-signup-otp', otpRequestRateLimiter, requestSignupOTPController);
router.post('/verify-signup-otp', authRateLimiter, verifySignupOTPController);
router.post('/request-password-reset-otp', otpRequestRateLimiter, requestPasswordResetOTPController);
router.post('/verify-password-reset-otp', authRateLimiter, verifyPasswordResetOTPController);

export default router;
