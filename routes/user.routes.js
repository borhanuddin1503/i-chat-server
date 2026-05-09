import express from 'express';
import { createUser, getUsers, logIn, SearchUsers, updateInfo, userWithProvider } from '../controllers/user.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = express.Router();

router.post('/register', createUser);
router.get('/', getUsers);

router.post('/login', logIn);
router.post('/provider-login', userWithProvider);
router.get('/search', SearchUsers);

router.patch('/update/:id' , verifyToken , updateInfo)

export default router;