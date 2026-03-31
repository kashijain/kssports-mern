import express from 'express';
import { getSalesReport } from '../controllers/adminReportController.js';
import { protect, seller } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/sales-report', protect, seller, getSalesReport);

export default router;
