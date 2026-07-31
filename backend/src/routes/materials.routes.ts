import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/requirePermission';
import * as controller from '../controllers/materials.controller';

const router = Router();

router.use(protect);

router.get('/', requirePermission('material.view'), controller.getMaterials);
router.get('/:id', requirePermission('material.view'), controller.getMaterialDetails);
router.post('/', requirePermission('material.manage'), controller.createMaterial);
router.patch('/:id', requirePermission('material.manage'), controller.updateMaterial);
router.delete('/:id', requirePermission('material.manage'), controller.deleteMaterial);
router.post('/:id/download', requirePermission('material.download'), controller.trackDownload);

export default router;
