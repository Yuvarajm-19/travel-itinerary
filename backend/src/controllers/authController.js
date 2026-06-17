const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// ── Register ──────────────────────────────────────────────────────────────────
/**
 * POST /api/auth/register
 * Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    return errorResponse(res, 'Email is already registered', 409);
  }

  const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password });

  const token = generateToken(user._id);

  return successResponse(
    res,
    {
      token,
      user: {
        _id:       user._id,
        name:      user.name,
        email:     user.email,
        createdAt: user.createdAt,
      },
    },
    'Account created successfully',
    201
  );
});

// ── Login ─────────────────────────────────────────────────────────────────────
/**
 * POST /api/auth/login
 * Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Explicitly select password since it's hidden by default
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  if (!user || !user.isActive) {
    return errorResponse(res, 'Invalid email or password', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return errorResponse(res, 'Invalid email or password', 401);
  }

  const token = generateToken(user._id);

  return successResponse(res, {
    token,
    user: {
      _id:       user._id,
      name:      user.name,
      email:     user.email,
      createdAt: user.createdAt,
    },
  }, 'Login successful');
});

// ── Get current user ──────────────────────────────────────────────────────────
/**
 * GET /api/auth/me
 * Protected
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return errorResponse(res, 'User not found', 404);

  return successResponse(res, { user }, 'User profile fetched');
});

// ── Update profile ────────────────────────────────────────────────────────────
/**
 * PUT /api/auth/me
 * Protected
 */
const updateMe = asyncHandler(async (req, res) => {
  const { name } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name: name?.trim() },
    { new: true, runValidators: true }
  );

  return successResponse(res, { user }, 'Profile updated successfully');
});

// ── Change password ───────────────────────────────────────────────────────────
/**
 * PUT /api/auth/change-password
 * Protected
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return errorResponse(res, 'Current password is incorrect', 400);
  }

  user.password = newPassword;
  await user.save();

  const token = generateToken(user._id);
  return successResponse(res, { token }, 'Password changed successfully');
});

module.exports = { register, login, getMe, updateMe, changePassword };
