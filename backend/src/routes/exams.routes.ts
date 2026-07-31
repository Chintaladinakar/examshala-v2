import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/requirePermission';
import * as controller from '../controllers/exams.controller';

const router = Router();

router.use(protect);

// Teacher authoring
router.post('/', requirePermission('exam.manage'), controller.createExam);
router.get('/', requirePermission('exam.view'), controller.getExams);
router.get('/:id', requirePermission('exam.view'), controller.getExamDetails);
router.patch('/:id/status', requirePermission('exam.manage'), controller.updateExamStatus);
router.delete('/:id', requirePermission('exam.manage'), controller.deleteExam);
router.get('/:id/results', requirePermission('exam.view'), controller.getExamResults);

// Student attempts
router.get('/student/available', requirePermission('exam.view'), controller.listAvailableExams);
router.post('/:id/attempt', requirePermission('exam.attempt'), controller.startAttempt);
router.patch('/attempts/:attemptId/autosave', requirePermission('exam.attempt'), controller.autosaveAnswer);
router.post('/attempts/:attemptId/submit', requirePermission('exam.attempt'), controller.submitAttempt);
router.post('/attempts/:attemptId/violation', requirePermission('exam.attempt'), controller.recordViolation);

export default router;
