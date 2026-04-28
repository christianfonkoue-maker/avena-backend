/**
 * AVENA — Validation Middleware
 * middleware/validation.js
 * 
 * Validates request data using express-validator
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation result handler
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      ok: false,
      error: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

// ============================================================
// USER VALIDATIONS
// ============================================================

const validateRegister = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 80 }).withMessage('First name must be between 2 and 80 characters'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 80 }).withMessage('Last name must be between 2 and 80 characters'),
  body('email')
    .trim()
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('studentId')
    .trim()
    .notEmpty().withMessage('Student ID is required')
    .isLength({ min: 4, max: 50 }).withMessage('Student ID must be between 4 and 50 characters'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
  handleValidationErrors,
];

const validateLogin = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

const validateForgotPassword = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  handleValidationErrors,
];

const validateResetPassword = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  handleValidationErrors,
];

const validateVerifyEmail = [
  body('code').isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits'),
  handleValidationErrors,
];

// ============================================================
// PRODUCT VALIDATIONS
// ============================================================

const validateProduct = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('price').isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  body('moq').optional().isInt({ min: 1 }).withMessage('MOQ must be at least 1'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be 0 or more'),
  body('condition').optional().isIn(['new', 'used']).withMessage('Condition must be "new" or "used"'),
  handleValidationErrors,
];

// ============================================================
// SERVICE VALIDATIONS
// ============================================================

const validateService = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('price').isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  body('priceType').optional().isIn(['fixed', 'starting', 'per_session', 'per_hour']),
  body('deliveryDays').optional().isInt({ min: 1 }).withMessage('Delivery days must be at least 1'),
  handleValidationErrors,
];

// ============================================================
// EVENT VALIDATIONS
// ============================================================

const validateEvent = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('is_paid').optional().isBoolean(),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be 0 or more'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  handleValidationErrors,
];

// ============================================================
// MESSAGE VALIDATIONS
// ============================================================

const validateMessage = [
  body('to').notEmpty().withMessage('Recipient ID is required'),
  body('body').trim().notEmpty().withMessage('Message body is required'),
  handleValidationErrors,
];

// ============================================================
// ID PARAM VALIDATION
// ============================================================

const validateIdParam = [
  param('id').isUUID().withMessage('Invalid ID format'),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyEmail,
  validateProduct,
  validateService,
  validateEvent,
  validateMessage,
  validateIdParam,
};