import { Router } from 'express';
import authController from '../controllers/authController';
import { auth } from '../types/auth';

const router = Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);
router.put('/change-password', auth, authController.changePassword);

export default router;
