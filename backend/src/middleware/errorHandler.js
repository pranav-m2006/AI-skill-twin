'use strict';

/**
 * Central error handler — must be the last app.use() in server.js.
 * Keeps stack traces out of production responses.
 */
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const isDev = process.env.NODE_ENV === 'development';

  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  if (isDev) console.error(err.stack);

  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(isDev && { stack: err.stack }),
  });
}

module.exports = { errorHandler };
