const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const {
  generate,
  getAll,
  getStats,
  getOne,
  update,
  remove,
  getByShareId,
} = require('../controllers/itineraryController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = Router();

const aiGenerateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: parseInt(process.env.AI_GENERATE_LIMIT, 10) || 50,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production',
  message: {
    success: false,
    message: `AI generation limit reached. You can generate up to ${process.env.AI_GENERATE_LIMIT || 50} itineraries per hour.`,
  },
});

// ── Validation ────────────────────────────────────────────────────────────────
const generateRules = [
  body('extractedData')
    .isArray({ min: 1 })
    .withMessage('extractedData must be a non-empty array'),
  body('extractedData.*.documentType')
    .notEmpty()
    .withMessage('Each document must have a documentType'),
];

// ── Protected routes ──────────────────────────────────────────────────────────
router.post('/generate', protect, aiGenerateLimiter, generateRules, validate, generate);
router.get('/',          protect,                           getAll);
router.get('/stats',     protect,                           getStats);
router.get('/:id',       protect,                           getOne);
router.put('/:id',       protect,                           update);
router.delete('/:id',    protect,                           remove);

// ── Public share route ────────────────────────────────────────────────────────
// Mounted separately at /api/share/:shareId in app.js
router.get('/share/:shareId', getByShareId);

module.exports = router;
