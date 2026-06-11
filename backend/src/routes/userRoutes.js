import express from 'express';
import {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  forgotPassword,
  resetPassword,
} from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authRateLimiter } from '../middlewares/rateLimiterMiddleware.js';

const router = express.Router();

router.post('/', authRateLimiter, registerUser);
router.post('/auth', authRateLimiter, authUser);   // added
router.post('/login', authRateLimiter, authUser);  // keep both
router.post('/logout', logoutUser);
router.get('/profile', protect, getUserProfile);
router.post('/forgotpassword', authRateLimiter, forgotPassword);
router.put('/resetpassword/:resettoken', authRateLimiter, resetPassword);

export default router;