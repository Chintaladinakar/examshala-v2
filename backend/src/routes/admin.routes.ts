import { Router } from 'express';
import { assignRoleController } from '../controllers/admin.controller';
import { protect, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Apply protection and restrict to 'admin' role
router.use(protect);
router.use(authorizeRoles('admin'));

// POST /api/admin/assign-role
router.post('/assign-role', assignRoleController);

export default router;
