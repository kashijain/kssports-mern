import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';

import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminInventoryRoutes from './routes/adminInventoryRoutes.js';
import adminReportRoutes from './routes/adminReportRoutes.js';
import batRepairRoutes from './routes/batRepairRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

const app = express();

const allowedOrigins = (process.env.CLIENT_URL ||
  'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin not allowed'));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/health', healthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin-inventory', adminInventoryRoutes);
app.use('/api/admin', adminInventoryRoutes);
app.use('/api/admin-reports', adminReportRoutes);
app.use('/api/admin', adminReportRoutes);
app.use('/api/bat-repairs', batRepairRoutes);
app.use('/api/expenses', expenseRoutes);

const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use(notFound);
app.use(errorHandler);

export default app;
