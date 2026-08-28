'use strict';

/**
 * Factory: returns an Express middleware that validates req.body with a Zod schema.
 * On failure, responds 400 with structured field errors.
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    req.body = result.data; // use coerced/transformed data
    next();
  };
}

module.exports = { validate };
