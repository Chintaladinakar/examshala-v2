import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import * as controller from '../controllers/messages.controller';

const router = Router();

router.use(protect);

router.get('/contacts', controller.getContacts);
router.get('/conversations', controller.getConversations);
router.post('/conversations', controller.startConversation);
router.get('/conversations/:id/messages', controller.getMessages);
router.post('/conversations/:id/messages', controller.sendMessage);

export default router;
