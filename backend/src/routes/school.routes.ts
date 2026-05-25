import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import * as schoolController from '../controllers/school.controller';

const router = Router();

// Protect all school routes
router.use(protect);

router.post('/switch-mode', schoolController.switchMode);
router.post('/students/add', schoolController.addStudent);
router.patch('/users/activate', schoolController.activateUser);

router.post('/classes/create', schoolController.createClass);
router.get('/classes', schoolController.getClasses);
router.post('/classes/link-teacher', schoolController.linkTeacherToClass);

router.post('/attendance/mark', schoolController.markAttendance);
router.patch('/attendance/update', schoolController.updateAttendance);
router.get('/attendance/class/:id', schoolController.getClassAttendance);

router.post('/assignments/create', schoolController.createAssignment);
router.get('/assignments', schoolController.getAssignments);
router.post('/assignments/:id/feedback', schoolController.addFeedback);

router.get('/teachers', schoolController.getWorkspaceTeachers);
router.get('/logs', schoolController.getSchoolLogs);
router.get('/profile', schoolController.getSchoolProfile);

export default router;
