import express from 'express';
import {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
} from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', registerUser);
router.post('/auth', authUser);   // added
router.post('/login', authUser);  // keep both
router.post('/logout', logoutUser);
router.get('/profile', protect, getUserProfile);

export default router;