import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { studentAccessGuard } from '../middleware/studentGuard';
import * as controller from '../controllers/student.controller';

const router = Router();

// Apply auth prefix to all student area routes
router.use(protect);
router.use(studentAccessGuard);

// BFF payload
router.get('/dashboard', controller.getDashboard);
router.get('/schedule', controller.getSchedule);

// Assignments
router.get('/assignments/:assignmentId', controller.getAssignment);

// Parents
router.get('/parents', controller.getParents);
router.post('/parents/link-request', controller.requestParentLink);
router.post('/parents/remove-request', controller.removeParentLink);

// Mock placeholders for standard entity endpoints (results, notifs, profile) 
// that can be expanded later
router.get('/results', controller.getResults);
router.get('/results/:id', controller.getResultById);
router.get('/notifications', controller.getNotifications);
router.get('/profile', controller.getProfile);
router.patch('/profile', controller.updateProfileInfo);
router.patch('/profile/photo', controller.updateProfilePhoto);
router.get('/settings', controller.getSettings);
router.patch('/settings/notifications', controller.updateNotificationSettings);
router.patch('/change-password', controller.changePassword);

export default router;
