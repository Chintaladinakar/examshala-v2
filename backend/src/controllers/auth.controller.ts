import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

export const signupController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;
    const result = await authService.signup({ name, email, password, role });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: result,
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

export const signinController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await authService.signin({ email, password });

    res.status(200).json({
      success: true,
      message: 'Signed in successfully',
      data: result,
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
