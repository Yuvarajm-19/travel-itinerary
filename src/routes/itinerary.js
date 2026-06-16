const { Router } = require('express');
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
router.post('/generate', protect, generateRules, validate, generate);
router.get('/',          protect,                           getAll);
router.get('/stats',     protect,                           getStats);
router.get('/:id',       protect,                           getOne);
router.put('/:id',       protect,                           update);
router.delete('/:id',    protect,                           remove);

// ── Public share route ────────────────────────────────────────────────────────
// Mounted separately at /api/share/:shareId in app.js
router.get('/share/:shareId', getByShareId);

module.exports = router;
