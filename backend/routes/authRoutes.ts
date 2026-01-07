import { Router } from 'express';
import { signup, login, logout, getCurrentUser, deleteAccount } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getCurrentUser);
router.delete('/account', authenticateToken, deleteAccount);

export default router;
