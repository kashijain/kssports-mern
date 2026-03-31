import express from 'express';
import {
  createPaymentOrder,
  verifyPaymentSignature,
} from '../controllers/orderController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/create-order', protect, createPaymentOrder);
router.post('/verify', protect, verifyPaymentSignature);

export default router;
