const { Router } = require('express');
const { body } = require('express-validator');
const { register, login, getMe, updateMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = Router();

// ── Validation rule sets ──────────────────────────────────────────────────────
const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Must be a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

// ── Routes ────────────────────────────────────────────────────────────────────
router.post('/register',        registerRules,       validate, register);
router.post('/login',           loginRules,          validate, login);
router.get('/me',               protect,                       getMe);
router.put('/me',               protect,                       updateMe);
router.put('/change-password',  protect, changePasswordRules,  validate, changePassword);

module.exports = router;
