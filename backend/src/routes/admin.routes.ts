import { Router } from 'express';
import { protect, authorizeRoles } from '../middleware/auth.middleware';
import * as adminController from '../controllers/admin.controller';

const router = Router();

// Protect all routes and restrict to ORG_ADMIN only
router.use(protect);
router.use(authorizeRoles('ORG_ADMIN'));

// -------------------------------------------------------------
// Users REST API
// -------------------------------------------------------------
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id', adminController.updateUserStatus);
router.put('/users/:id', adminController.editUser);
router.delete('/users/:id', adminController.deleteUser);
router.post('/assign-role', adminController.assignRoleController); // backwards compatibility

// -------------------------------------------------------------
// Workspaces REST API
// -------------------------------------------------------------
router.get('/workspaces', adminController.getAllWorkspaces);
router.post('/workspaces', adminController.createWorkspace);
router.patch('/workspaces/:id', adminController.assignPrincipal);
router.put('/workspaces/:id', adminController.editWorkspace);
router.delete('/workspaces/:id', adminController.deleteWorkspace);

// -------------------------------------------------------------
// Invites REST API
// -------------------------------------------------------------
router.get('/invites', adminController.getAllInvites);
router.post('/invites', adminController.sendInvite);

// -------------------------------------------------------------
// Parent-Link REST API
// -------------------------------------------------------------
router.get('/parent-links', adminController.getParentLinks);
router.post('/parent-links/:id/approve', adminController.approveParentLink);
router.post('/parent-links/:id/reject', adminController.rejectParentLink);

// -------------------------------------------------------------
// Logs REST API
// -------------------------------------------------------------
router.get('/logs', adminController.getAllLogs);

// -------------------------------------------------------------
// Profile REST API
// -------------------------------------------------------------
router.get('/profile', adminController.getAdminProfile);

export default router;
