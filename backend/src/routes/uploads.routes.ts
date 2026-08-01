import { Router } from 'express';
import { z } from 'zod';
import { protect } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { uploadMiddleware, uploadFile } from '../controllers/uploads.controller';

const router = Router();

const uploadFieldsSchema = z.object({
  materialType: z.string().min(1).max(20),
});

router.post(
  '/',
  protect,
  (req, res, next) => {
    uploadMiddleware(req, res, (err: any) => {
      if (err) {
        const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        res.status(status).json({ success: false, message: err.code === 'LIMIT_FILE_SIZE' ? 'File exceeds the 25MB upload limit.' : (err.message || 'Upload failed.') });
        return;
      }
      next();
    });
  },
  validateBody(uploadFieldsSchema),
  uploadFile
);

export default router;
