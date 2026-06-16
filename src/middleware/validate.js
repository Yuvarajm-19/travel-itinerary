const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Run after express-validator chains.
 * Returns 422 with a structured errors array on failure.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return errorResponse(res, 'Validation failed', 422, formatted);
  }
  next();
};

module.exports = { validate };
