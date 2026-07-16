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

const router = Router();

router.post('/signup', signupController);
router.post('/signin', signinController);
router.post('/reset-password', resetPasswordController);
router.post('/forgot-password', forgotPasswordController);
router.post('/reset-password-with-token', resetPasswordWithTokenController);

// OTP routes
router.post('/request-signup-otp', requestSignupOTPController);
router.post('/verify-signup-otp', verifySignupOTPController);
router.post('/request-password-reset-otp', requestPasswordResetOTPController);
router.post('/verify-password-reset-otp', verifyPasswordResetOTPController);

export default router;
