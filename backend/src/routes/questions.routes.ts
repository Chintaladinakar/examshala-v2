import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/requirePermission';
import * as controller from '../controllers/questions.controller';

const router = Router();

router.use(protect);

router.get('/', controller.getQuestions);
router.post('/', controller.createQuestion);
router.post('/bulk-import', controller.bulkImportQuestions);
router.patch('/:id', controller.updateQuestion);
router.patch('/:id/review', requirePermission('question.approve'), controller.reviewQuestion);
router.delete('/:id', controller.deleteQuestion);

export default router;
