import mongoose from 'mongoose';

const connectDB = async () => {
  const mongoUri = String(process.env.MONGO_URI || '').trim();

  if (!mongoUri) {
    console.error(
      'MongoDB startup error: MONGO_URI is missing. Add it in the Render environment variables before deploying.'
    );
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection failed.', {
      message: error.message,
      name: error.name,
      code: error.code || null,
    });
    process.exit(1);
  }
};

export default connectDB;
