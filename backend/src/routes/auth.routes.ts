import { Router } from 'express';
import { 
  signupController, 
  signinController, 
  resetPasswordController,
  forgotPasswordController,
  resetPasswordWithTokenController
} from '../controllers/auth.controller';

const router = Router();

router.post('/signup', signupController);
router.post('/signin', signinController);
router.post('/reset-password', resetPasswordController);
router.post('/forgot-password', forgotPasswordController);
router.post('/reset-password-with-token', resetPasswordWithTokenController);

export default router;
