const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { notFound, errorHandler } = require('./middleware/errorHandler');

// ── Route modules ─────────────────────────────────────────────────────────────
const authRoutes      = require('./routes/auth');
const uploadRoutes    = require('./routes/upload');
const itineraryRoutes = require('./routes/itinerary');
const shareRoutes     = require('./routes/share');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
];

app.use(helmet());

console.log("CLIENT_URL =", process.env.CLIENT_URL);
console.log("NODE_ENV =", process.env.NODE_ENV);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// ── Rate limiting ─────────────────────────────────────────────────────────────
const isDev = process.env.NODE_ENV !== 'production';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again later' },
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : (parseInt(process.env.UPLOAD_LIMIT, 10) || 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Upload limit reached, please wait a few minutes.' },
});

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status:  'healthy',
    env:     process.env.NODE_ENV,
    time:    new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'AI Travel Itinerary Generator API',
    version: '1.0.0',
    docs:    '/health',
  });
});

// ── API root check ────────────────────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'AI Travel Itinerary API is running 🚀',
    version: '1.0.0',
    routes: [
      '/api/auth',
      '/api/upload',
      '/api/itinerary',
      '/api/share'
    ]
  });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',      authLimiter,     authRoutes);
app.use('/api/upload',    uploadLimiter,   uploadRoutes);
app.use('/api/itinerary',                     itineraryRoutes);
app.use('/api/share',                      shareRoutes);

// ── 404 & error handlers ──────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
