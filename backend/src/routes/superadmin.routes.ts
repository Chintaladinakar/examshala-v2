import { Router } from 'express';
import * as superadminController from '../controllers/superadmin.controller';
import { protect, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Protect all routes and restrict to 'superadmin' only
router.use(protect);
router.use(authorizeRoles('superadmin'));

// Dashboard Overview
router.get('/dashboard', superadminController.getDashboardData);

// User Management
router.get('/users', superadminController.getAllUsers);
router.patch('/users/:id/status', superadminController.updateUserStatus);
router.patch('/users/:id/role', superadminController.updateUserRole);

// Workspace Management
router.get('/workspaces', superadminController.getAllWorkspaces);
router.post('/workspaces', superadminController.createWorkspace);
router.delete('/workspaces/:id', superadminController.deleteWorkspace);

// Results Monitoring
router.get('/results', superadminController.getAllResults);

// Platform Settings
router.get('/settings', superadminController.getPlatformSettings);
router.patch('/settings', superadminController.updatePlatformSettings);

export default router;
