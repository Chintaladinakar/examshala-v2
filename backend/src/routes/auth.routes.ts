import { Router } from 'express';
import { signupController, signinController, resetPasswordController } from '../controllers/auth.controller';

const router = Router();

router.post('/signup', signupController);
router.post('/signin', signinController);
router.post('/reset-password', resetPasswordController);

export default router;
