const { errorResponse } = require('../utils/apiResponse');

/**
 * 404 handler — catches requests to undefined routes.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global error handler — must have 4 parameters for Express to recognise it.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Internal Server Error';

  // ── Mongoose cast error (invalid ObjectId) ────────────────────────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // ── Mongoose duplicate key ────────────────────────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} "${value}" is already registered`;
  }

  // ── Mongoose validation error ─────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 422;
    const errors = Object.values(err.errors).map((e) => e.message);
    message = errors.join('. ');
  }

  // ── JWT errors ────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
  }

  // ── Multer errors ─────────────────────────────────────────────────────────
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = `File too large. Maximum allowed size is ${process.env.MAX_FILE_SIZE / 1024 / 1024} MB`;
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    statusCode = 400;
    message = 'Too many files uploaded at once';
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field in the request';
  }

  // ── Log in development ────────────────────────────────────────────────────
  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${statusCode} — ${message}`);
    console.error(err.stack);
  }

  return errorResponse(res, message, statusCode);
};

module.exports = { notFound, errorHandler };
