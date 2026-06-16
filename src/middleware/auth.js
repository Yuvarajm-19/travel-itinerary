const asyncHandler = require('express-async-handler');
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Protect routes — validates Bearer JWT and attaches `req.user`.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorised — no token provided');
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    res.status(401);
    throw new Error(
      err.name === 'TokenExpiredError'
        ? 'Token has expired — please log in again'
        : 'Invalid token — please log in again'
    );
  }

  const user = await User.findById(decoded.id).select('-password');
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error('User belonging to this token no longer exists');
  }

  req.user = user;
  next();
});

/**
 * Optional auth — attaches req.user if a valid token is present,
 * but never blocks the request.
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('-password');
      if (user?.isActive) req.user = user;
    } catch {
      // silently ignore invalid / expired tokens for optional auth
    }
  }

  next();
});

module.exports = { protect, optionalAuth };
