import express from 'express';
import {
  handleChatMessage,
  getInquiries,
  updateInquiryStatus,
  deleteInquiry,
  exportInquiries,
  getChatbotAnalytics,
  searchProductsApi,
  getProductsByCategory,
  getProductsByBrand
} from '../controllers/chatbotController.js';
import { protect, seller } from '../middlewares/authMiddleware.js';
import { rateLimiter } from '../middlewares/rateLimiterMiddleware.js';

const router = express.Router();

// Public chatbot message resolution (Rate limited to prevent query abuse)
router.post('/message', rateLimiter, handleChatMessage);

// Public product search APIs
router.get('/products/search', searchProductsApi);
router.get('/products/category/:category', getProductsByCategory);
router.get('/products/brand/:brand', getProductsByBrand);

// Protected inquiry console endpoints (Seller access only)
router.get('/inquiries', protect, seller, getInquiries);
router.get('/inquiries/export', protect, seller, exportInquiries);
router.get('/analytics', protect, seller, getChatbotAnalytics);
router.put('/inquiries/:id', protect, seller, updateInquiryStatus);
router.delete('/inquiries/:id', protect, seller, deleteInquiry);

export default router;
