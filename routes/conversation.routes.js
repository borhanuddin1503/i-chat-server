import express from 'express';
import { getConversations, getConversationWithUser, searchConversations } from '../controllers/conversation.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = express.Router();

router.get('/withUserInfo/:id', getConversationWithUser);
router.get('/', verifyToken, getConversations);
router.get('/search', verifyToken, searchConversations);

export default router;