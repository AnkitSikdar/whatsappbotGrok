// ─────────────────────────────────────────────────────────────
//  middleware/validation.js  – Input validation rules
// ─────────────────────────────────────────────────────────────

const { body, validationResult } = require('express-validator');

// ── Chat message validation ───────────────────────────────────
const validateChatMessage = [
  body('message')
    .trim()
    .notEmpty().withMessage('Message cannot be empty.')
    .isLength({ max: 1000 }).withMessage('Message must be under 1000 characters.'),
  body('sessionId')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Invalid session ID.'),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone().withMessage('Invalid phone number format.')
];

// ── Validate and respond ──────────────────────────────────────
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
}

module.exports = { validateChatMessage, handleValidationErrors };
