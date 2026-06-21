export function globalErrorHandler(err, req, res, next) {
  console.error('Global Error Boundary Caught:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  const response = {
    success: false,
    message: message,
  };

  // Only expose details/stack in development environment
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = err.details || null;
  }

  res.status(statusCode).json(response);
}

// Custom API Error utility class to simplify throwing error states
export class ApiError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}
