function errorHandler(err, req, res, next) {
  console.error('[Error]', err.message);
  res.status(500).json({
    success: false,
    error: {
      code:    'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
      details: process.env.NODE_ENV === 'development' ? err.message : null,
    },
  });
}

function notFound(req, res) {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found.` },
  });
}

module.exports = { errorHandler, notFound };
