import express from 'express';
import { getMessages } from '../controllers/message.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = express.Router();

router.get('/:id', verifyToken, getMessages)

export default router;