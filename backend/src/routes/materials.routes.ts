import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import * as controller from '../controllers/materials.controller';

const router = Router();

router.use(protect);

router.get('/', controller.getMaterials);
router.get('/:id', controller.getMaterialDetails);
router.post('/', controller.createMaterial);
router.delete('/:id', controller.deleteMaterial);

export default router;
