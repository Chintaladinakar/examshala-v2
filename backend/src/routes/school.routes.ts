import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/requirePermission';
import * as schoolController from '../controllers/school.controller';
import { getTutorDashboard } from '../controllers/dashboard.controller';
import { getCalendarEvents, createCalendarEvent, deleteCalendarEvent } from '../controllers/calendar.controller';
import { getReports } from '../controllers/reports.controller';
import * as departmentsController from '../controllers/departments.controller';
import * as subjectsController from '../controllers/subjects.controller';
import * as teacherManagementController from '../controllers/teacherManagement.controller';
import * as studentManagementController from '../controllers/studentManagement.controller';

const router = Router();

// Protect all school routes
router.use(protect);

router.get('/dashboard', getTutorDashboard);
router.get('/calendar', getCalendarEvents);
router.post('/calendar', requirePermission('calendar.manage'), createCalendarEvent);
router.delete('/calendar/:id', requirePermission('calendar.manage'), deleteCalendarEvent);
router.get('/reports', getReports);

router.post('/students/add', schoolController.addStudent);
router.patch('/users/activate', schoolController.activateUser);

router.post('/classes/create', schoolController.createClass);
router.get('/classes', schoolController.getClasses);
router.delete('/classes/:id', schoolController.deleteClass);
router.get('/students', schoolController.getScopedStudents);
router.post('/classes/link-teacher', schoolController.linkTeacherToClass);
router.patch('/classes/assign', schoolController.assignToClass);

router.get('/departments', departmentsController.listDepartments);
router.post('/departments', departmentsController.createDepartment);
router.patch('/departments/:id', departmentsController.updateDepartment);
router.delete('/departments/:id', departmentsController.deleteDepartment);

router.get('/subjects', subjectsController.listSubjects);
router.post('/subjects', subjectsController.createSubject);
router.patch('/subjects/:id', subjectsController.updateSubject);
router.delete('/subjects/:id', subjectsController.deleteSubject);

router.get('/teachers-directory', teacherManagementController.listTeachersDetailed);
router.post('/teachers-directory', teacherManagementController.createOrAssociateTeacher);
router.patch('/teachers-directory/:id/status', teacherManagementController.updateTeacherStatus);
router.patch('/teachers-directory/:id/profile', teacherManagementController.updateTeacherProfile);
router.patch('/teachers-directory/:id/assignments', teacherManagementController.assignTeacherClassesSubjects);

router.get('/students-directory', studentManagementController.listStudentsDetailed);
router.post('/students-directory', studentManagementController.createOrAssociateStudent);

router.get('/settings', schoolController.getPrincipalSettings);
router.patch('/settings/workspace', schoolController.updateWorkspaceProfile);

router.post('/attendance/mark', requirePermission('attendance.mark'), schoolController.markAttendance);
router.patch('/attendance/update', requirePermission('attendance.mark'), schoolController.updateAttendance);
router.get('/attendance/class/:id', requirePermission('attendance.view'), schoolController.getClassAttendance);
router.get('/attendance/report', requirePermission('attendance.view'), schoolController.getAttendanceReport);
router.post('/attendance/copy', requirePermission('attendance.mark'), schoolController.copyAttendance);

router.post('/assignments/create', schoolController.createAssignment);
router.get('/assignments', schoolController.getAssignments);
router.patch('/assignments/:id', schoolController.updateAssignment);
router.delete('/assignments/:id', schoolController.deleteAssignment);
router.get('/assignments/:id/submissions', schoolController.getAssignmentSubmissions);
router.patch('/assignments/submissions/:id/grade', schoolController.gradeSubmission);
router.put('/assignments/:id/rubric', schoolController.upsertRubric);
router.get('/assignments/:id/rubric', schoolController.getRubric);
router.patch('/assignments/submissions/:id/rubric-score', schoolController.scoreSubmissionRubric);
router.patch('/assignments/submissions/:id/plagiarism', schoolController.setPlagiarismStatus);
router.post('/assignments/:id/feedback', schoolController.addFeedback);

router.post('/timetable', requirePermission('timetable.manage'), schoolController.createTimetableSlot);
router.get('/timetable/class/:id', requirePermission('timetable.view'), schoolController.getClassTimetable);
router.patch('/timetable/:id', requirePermission('timetable.manage'), schoolController.updateTimetableSlot);
router.delete('/timetable/:id', requirePermission('timetable.manage'), schoolController.deleteTimetableSlot);

router.get('/announcements', requirePermission('announcement.view'), schoolController.getAnnouncements);
router.post('/announcements', requirePermission('announcement.manage'), schoolController.createAnnouncement);

router.get('/teachers', schoolController.getWorkspaceTeachers);
router.get('/logs', schoolController.getSchoolLogs);
router.get('/profile', schoolController.getSchoolProfile);
router.patch('/change-password', schoolController.changeSchoolPassword);
router.get('/notification-settings', schoolController.getSchoolNotificationSettings);
router.patch('/notification-settings', schoolController.updateSchoolNotificationSettings);

export default router;
