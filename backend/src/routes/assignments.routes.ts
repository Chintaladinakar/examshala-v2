import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/requirePermission';
import * as controller from '../controllers/assignments.controller';

const router = Router();

router.use(protect);

router.get('/', requirePermission('assignment.view'), controller.getAssignments);
router.get('/stats', requirePermission('assignment.view'), controller.getStats);
router.get('/:id', requirePermission('assignment.view'), controller.getAssignmentDetails);
router.post('/submit', requirePermission('assignment.submit'), controller.submitAssignment);
router.put('/submit/:id', requirePermission('assignment.submit'), controller.editSubmission);

export default router;
