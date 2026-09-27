function notFound(req, res) {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} does not exist`
  });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid Identifier',
      message: 'The supplied task id is not valid'
    });
  }

  const status = err.status || 500;

  return res.status(status).json({
    error: status === 500 ? 'Internal Server Error' : 'Request Error',
    message: status === 500 ? 'An unexpected error occurred' : err.message
  });
}

module.exports = { notFound, errorHandler };
