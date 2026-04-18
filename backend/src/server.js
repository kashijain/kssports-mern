import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './app.js';

dotenv.config();

console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'OK' : 'MISSING');
console.log(
  'RAZORPAY_KEY_SECRET:',
  process.env.RAZORPAY_KEY_SECRET ? 'OK' : 'MISSING'
);
console.log(
  'CLOUDINARY:',
  process.env.CLOUDINARY_CLOUD_NAME ? 'OK' : 'MISSING'
);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer().catch((error) => {
  console.error(`Server startup failed: ${error.message}`);
  process.exit(1);
});
