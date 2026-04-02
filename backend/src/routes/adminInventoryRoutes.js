import express from 'express';
import {
  createOfflineSale,
  deleteOfflineSale,
  getOfflineSales,
  getPendingOfflinePayments,
  updateOfflineSale,
  uploadOfflineSalesSheet,
  uploadOfflineSalesSheetMiddleware,
  uploadStockSheet,
  uploadStockSheetMiddleware,
} from '../controllers/adminInventoryController.js';
import { protect, seller } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post(
  '/upload-stock-sheet',
  protect,
  seller,
  uploadStockSheetMiddleware,
  uploadStockSheet
);

router.post(
  '/offline-sales/upload',
  protect,
  seller,
  uploadOfflineSalesSheetMiddleware,
  uploadOfflineSalesSheet
);

router.get('/offline-sales/pending', protect, seller, getPendingOfflinePayments);

router
  .route('/offline-sales')
  .get(protect, seller, getOfflineSales)
  .post(protect, seller, createOfflineSale);

router
  .route('/offline-sales/:id')
  .put(protect, seller, updateOfflineSale)
  .delete(protect, seller, deleteOfflineSale);

export default router;
