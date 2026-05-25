import { Router } from 'express';
import { protect, authorizeRoles } from '../middleware/auth.middleware';
import * as adminController from '../controllers/admin.controller';

const router = Router();

// Protect all routes and restrict to ORG_ADMIN or admin role
router.use(protect);
router.use(authorizeRoles('ORG_ADMIN', 'admin'));

// -------------------------------------------------------------
// Users REST API
// -------------------------------------------------------------
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id', adminController.updateUserStatus);
router.post('/assign-role', adminController.assignRoleController); // backwards compatibility

// -------------------------------------------------------------
// Workspaces REST API
// -------------------------------------------------------------
router.get('/workspaces', adminController.getAllWorkspaces);
router.post('/workspaces', adminController.createWorkspace);
router.patch('/workspaces/:id', adminController.assignPrincipal);

// -------------------------------------------------------------
// Invites REST API
// -------------------------------------------------------------
router.get('/invites', adminController.getAllInvites);
router.post('/invites', adminController.sendInvite);

// -------------------------------------------------------------
// Logs REST API
// -------------------------------------------------------------
router.get('/logs', adminController.getAllLogs);

// -------------------------------------------------------------
// Profile REST API
// -------------------------------------------------------------
router.get('/profile', adminController.getAdminProfile);

export default router;
