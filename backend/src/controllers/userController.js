import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import {
  canRegisterAsSeller,
  syncUserRoleWithWhitelist,
} from '../utils/sellerAccess.js';

const formatUserResponse = (user, token) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  token,
});

export const authUser = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const { password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  let user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  user = await syncUserRoleWithWhitelist(user);
  const token = generateToken(res, user._id);

  res.json(formatUserResponse(user, token));
};

export const registerUser = async (req, res) => {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const { password, role, sellerSecret } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email, and password are required');
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  let finalRole = 'customer';

  if (role === 'seller') {
    const sellerCheck = canRegisterAsSeller({ name, email, sellerSecret });

    if (!sellerCheck.allowed) {
      res.status(403);
      throw new Error(sellerCheck.message);
    }

    finalRole = 'seller';
  }

  let user = await User.create({
    name,
    email,
    password,
    role: finalRole,
  });

  user = await syncUserRoleWithWhitelist(user);
  const token = generateToken(res, user._id);

  res.status(201).json(formatUserResponse(user, token));
};

export const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

export const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const syncedUser = await syncUserRoleWithWhitelist(user);
  res.json(formatUserResponse(syncedUser));
};
