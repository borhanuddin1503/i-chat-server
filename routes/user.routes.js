import express from 'express';
import { createUser, getUsers, logIn, SearchUsers, userWithProvider } from '../controllers/user.controller.js';

const router = express.Router();

router.post('/register', createUser);
router.get('/', getUsers);

router.post('/login', logIn);
router.post('/provider-login', userWithProvider);
router.get('/search', SearchUsers);

export default router;