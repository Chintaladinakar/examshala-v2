import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/requirePermission';
import { validateBody } from '../middleware/validate.middleware';
import { submitAssignmentSchema, editSubmissionSchema } from '../schemas/assignments.schemas';
import * as controller from '../controllers/assignments.controller';

const router = Router();

router.use(protect);

router.get('/', requirePermission('assignment.view'), controller.getAssignments);
router.get('/stats', requirePermission('assignment.view'), controller.getStats);
router.get('/:id', requirePermission('assignment.view'), controller.getAssignmentDetails);
router.post('/submit', requirePermission('assignment.submit'), validateBody(submitAssignmentSchema), controller.submitAssignment);
router.put('/submit/:id', requirePermission('assignment.submit'), validateBody(editSubmissionSchema), controller.editSubmission);

export default router;
