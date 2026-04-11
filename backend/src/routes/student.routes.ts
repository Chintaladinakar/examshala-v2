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

// Assignments
router.get('/assignments/:assignmentId', controller.getAssignment);

// Parents
router.get('/parents', controller.getParents);
router.post('/parents/link-request', controller.requestParentLink);
router.post('/parents/remove-request', controller.removeParentLink);

// Mock placeholders for standard entity endpoints (results, notifs, profile) 
// that can be expanded later
router.get('/results', (req, res) => res.json({ success: true, data: [] }));
router.get('/notifications', (req, res) => res.json({ success: true, data: [] }));
router.get('/profile', (req, res) => res.json({ success: true, data: {} }));

export default router;
