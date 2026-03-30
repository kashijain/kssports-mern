import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { protect, seller } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.route('/').get(getProducts).post(protect, seller, upload.array('images', 4), createProduct);
router
  .route('/:id')
  .get(getProductById)
  .put(protect, seller, upload.array('images', 4), updateProduct)
  .delete(protect, seller, deleteProduct);

export default router;
