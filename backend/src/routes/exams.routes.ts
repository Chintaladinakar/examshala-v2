import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/requirePermission';
import { validateBody } from '../middleware/validate.middleware';
import {
  autosaveAnswerSchema,
  submitAttemptSchema,
  createExamSchema,
  updateExamStatusSchema,
  reviewExamSchema,
} from '../schemas/exams.schemas';
import * as controller from '../controllers/exams.controller';

const router = Router();

router.use(protect);

// Teacher authoring
router.post('/', requirePermission('exam.manage'), validateBody(createExamSchema), controller.createExam);
router.get('/', requirePermission('exam.view'), controller.getExams);
router.get('/institution-summary', requirePermission('exam.view'), controller.getInstitutionExamSummary);
router.get('/:id', requirePermission('exam.view'), controller.getExamDetails);
router.patch('/:id/status', requirePermission('exam.manage'), validateBody(updateExamStatusSchema), controller.updateExamStatus);
router.patch('/:id/review', requirePermission('exam.approve'), validateBody(reviewExamSchema), controller.reviewExam);
router.delete('/:id', requirePermission('exam.manage'), controller.deleteExam);
router.get('/:id/results', requirePermission('exam.view'), controller.getExamResults);

// Student attempts
router.get('/student/available', requirePermission('exam.view'), controller.listAvailableExams);
router.post('/:id/attempt', requirePermission('exam.attempt'), controller.startAttempt);
router.patch('/attempts/:attemptId/autosave', requirePermission('exam.attempt'), validateBody(autosaveAnswerSchema), controller.autosaveAnswer);
router.post('/attempts/:attemptId/submit', requirePermission('exam.attempt'), validateBody(submitAttemptSchema), controller.submitAttempt);
router.post('/attempts/:attemptId/violation', requirePermission('exam.attempt'), controller.recordViolation);

export default router;
