import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { studentAccessGuard } from '../middleware/studentGuard';
import * as controller from '../controllers/student.controller';
import { getStudentCalendarEvents } from '../controllers/calendar.controller';

const router = Router();

// Apply auth prefix to all student area routes
router.use(protect);
router.use(studentAccessGuard);

// BFF payload
router.get('/dashboard', controller.getDashboard);
router.get('/schedule', controller.getSchedule);
router.get('/attendance', controller.getAttendance);
router.get('/calendar', getStudentCalendarEvents);
router.get('/announcements', controller.getAnnouncements);
router.get('/search', controller.getGlobalSearch);
router.get('/leaderboard', controller.getLeaderboard);
router.get('/subjects', controller.getSubjects);
router.get('/timetable', controller.getTimetable);

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
