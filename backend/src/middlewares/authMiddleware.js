import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// User must be authenticated
const protect = async (req, res, next) => {
  let token;

  console.log('\n--- AUTH MIDDLEWARE DEBUG ---');
  console.log('Headers Auth:', req.headers.authorization ? 'Present' : 'Missing');
  console.log('Cookies JWT:', req.cookies.jwt ? 'Present' : 'Missing');

  // Check headers for Bearer token first
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log('Extracted Token from Header:', token.substring(0, 15) + '...');
  } 
  // Fallback to cookies
  else if (req.cookies.jwt) {
    token = req.cookies.jwt;
    console.log('Extracted Token from Cookie:', token.substring(0, 15) + '...');
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded User ID:', decoded.userId);
      req.user = await User.findById(decoded.userId).select('-password');
      console.log('Found User Role:', req.user ? req.user.role : 'USER NOT FOUND');
      next();
    } catch (error) {
      console.error('JWT Verify Error:', error.message);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    console.log('No token found in request');
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// User must be a seller
const seller = (req, res, next) => {
  if (req.user && req.user.role === 'seller') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a seller' });
  }
};

export { protect, seller };
