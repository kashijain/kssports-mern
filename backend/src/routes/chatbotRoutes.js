import express from 'express';
import {
  handleChatMessage,
  getInquiries,
  updateInquiryStatus,
  deleteInquiry,
  exportInquiries,
} from '../controllers/chatbotController.js';
import { protect, seller } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public chatbot message resolution
router.post('/message', handleChatMessage);

// Protected inquiry console endpoints (Seller access only)
router.get('/inquiries', protect, seller, getInquiries);
router.get('/inquiries/export', protect, seller, exportInquiries);
router.put('/inquiries/:id', protect, seller, updateInquiryStatus);
router.delete('/inquiries/:id', protect, seller, deleteInquiry);

export default router;
