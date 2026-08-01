import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/requirePermission';
import { validateBody } from '../middleware/validate.middleware';
import { createMaterialSchema, updateMaterialSchema } from '../schemas/materials.schemas';
import * as controller from '../controllers/materials.controller';

const router = Router();

router.use(protect);

router.get('/', requirePermission('material.view'), controller.getMaterials);
router.get('/file/:fileId', requirePermission('material.view'), controller.streamMaterialFile);
router.get('/:id', requirePermission('material.view'), controller.getMaterialDetails);
router.post('/', requirePermission('material.manage'), validateBody(createMaterialSchema), controller.createMaterial);
router.patch('/:id', requirePermission('material.manage'), validateBody(updateMaterialSchema), controller.updateMaterial);
router.delete('/:id', requirePermission('material.manage'), controller.deleteMaterial);
router.post('/:id/download', requirePermission('material.download'), controller.trackDownload);

export default router;
