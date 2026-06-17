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

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (e.g. curl, Postman, server-to-server)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Rate limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again later' },
});

const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI generation limit reached, please try again in an hour' },
});

app.use(globalLimiter);

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
app.use('/api/upload',                     uploadRoutes);
app.use('/api/itinerary', generateLimiter, itineraryRoutes);
app.use('/api/share',                      shareRoutes);

// ── 404 & error handlers ──────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
