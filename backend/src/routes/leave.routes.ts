import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/requirePermission';
import * as controller from '../controllers/leave.controller';

const router = Router();

router.use(protect);

router.post('/', requirePermission('leave.request'), controller.createLeaveRequest);
router.get('/mine', requirePermission('leave.request'), controller.listMyLeaveRequests);
router.get('/all', requirePermission('leave.manage'), controller.listWorkspaceLeaveRequests);
router.patch('/:id/review', requirePermission('leave.manage'), controller.reviewLeaveRequest);

export default router;
