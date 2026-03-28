import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const connectDB = async () => {
  try {
    // Attempt to connect to original DB first (with short timeout)
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000 
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Original MongoDB connection failed. Falling back to Memory Server...`);
    try {
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      const conn = await mongoose.connect(mongoUri);
      console.log(`MongoDB Memory Server Connected: ${conn.connection.host}`);
      
      // Optionally create a dummy admin user and products to ensure frontend works
      await seedMemoryDB();
      
    } catch (memError) {
      console.error(`Error: ${memError.message}`);
      process.exit(1);
    }
  }
};

const seedMemoryDB = async () => {
  try {
    // We will dynamically import models so we don't break the file if they don't exist
    const { default: User } = await import('../models/userModel.js');
    const { default: Product } = await import('../models/productModel.js');
    
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      isAdmin: true
    });

    await Product.create([
      {
        user: adminUser._id,
        name: 'Premium English Willow Cricket Bat',
        image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?auto=format&fit=crop&q=80',
        brand: 'K.S. Sports',
        category: 'Bats',
        description: 'Elite grade 1 english willow carefully hand-crafted for the professional player.',
        rating: 5,
        numReviews: 12,
        price: 399.99,
        countInStock: 25
      },
      {
        user: adminUser._id,
        name: 'Professional Leather Cricket Ball',
        image: 'https://images.unsplash.com/photo-1540747913346-19e32fc3ce0e?auto=format&fit=crop&q=80',
        brand: 'K.S. Sports',
        category: 'Balls',
        description: 'Alum tanned leather, four-piece construction matching international standards.',
        rating: 4.8,
        numReviews: 34,
        price: 24.99,
        countInStock: 100
      },
      {
        user: adminUser._id,
        name: 'Elite Batting Gloves',
        image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80',
        brand: 'K.S. Sports',
        category: 'Gloves',
        description: 'High-density foam pre-curved fingers with premium sheep leather palm.',
        rating: 4.5,
        numReviews: 8,
        price: 59.99,
        countInStock: 0
      }
    ]);
    console.log('Seeded Memory DB with sample data.');
  } catch(e) {
    console.log('Could not seed memory db: ', e.message);
  }
};

export default connectDB;
