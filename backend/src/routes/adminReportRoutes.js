import express from 'express';
import { getBusinessSummary, getSalesReport } from '../controllers/adminReportController.js';
import { protect, seller } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/business-summary', protect, seller, getBusinessSummary);
router.get('/sales-report', protect, seller, getSalesReport);

export default router;
