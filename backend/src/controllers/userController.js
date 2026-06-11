import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import {
  canRegisterAsSeller,
  syncUserRoleWithWhitelist,
} from '../utils/sellerAccess.js';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

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

// @desc    Forgot password request
// @route   POST /api/users/forgotpassword
// @access  Public
export const forgotPassword = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('There is no user with that email address');
  }

  const resetToken = user.getResetPasswordToken();
  await user.save();

  const frontendUrl = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',')[1] || process.env.CLIENT_URL.split(',')[0]
    : 'http://localhost:5173';
  const resetUrl = `${frontendUrl.trim()}/reset-password/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) have requested the reset of a password. Please use the link below to complete the process:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'K.S. Sports - Password Reset Request',
      message,
    });

    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending reset email:', error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(500);
    throw new Error('Email could not be sent');
  }
};

// @desc    Reset password
// @route   PUT /api/users/resetpassword/:resettoken
// @access  Public
export const resetPassword = async (req, res) => {
  const { password } = req.body;

  if (!password) {
    res.status(400);
    throw new Error('New password is required');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters long');
  }

  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  const token = generateToken(res, user._id);
  res.status(200).json({
    success: true,
    message: 'Password reset successful',
    ...formatUserResponse(user, token),
  });
};
