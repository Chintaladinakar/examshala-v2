import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import * as controller from '../controllers/notifications.controller';

const router = Router();

router.use(protect);

router.get('/', controller.getNotifications);
router.get('/unread-count', controller.getUnreadCount);
router.patch('/:id/read', controller.markAsRead);
router.patch('/read-all', controller.markAllAsRead);

export default router;
