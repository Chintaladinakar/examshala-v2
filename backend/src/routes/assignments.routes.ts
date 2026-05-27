import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import * as controller from '../controllers/assignments.controller';

const router = Router();

router.use(protect);

router.get('/', controller.getAssignments);
router.get('/stats', controller.getStats);
router.get('/:id', controller.getAssignmentDetails);
router.post('/submit', controller.submitAssignment);
router.put('/submit/:id', controller.editSubmission);

export default router;
