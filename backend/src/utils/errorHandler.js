// PATH: backend/src/utils/errorHandler.js
// Secure Error Handling - Prevents Information Leakage

/**
 * Secure error handler middleware
 * Logs errors internally but returns safe messages to clients
 */
export const errorHandler = (err, req, res, next) => {
  // Log error details internally (for debugging)
  console.error("Error:", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
    userId: req.user?._id,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  // Determine error type and return safe message
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Geçersiz istek verisi",
    });
  }

  if (err.name === "UnauthorizedError" || err.name === "JsonWebTokenError") {
    return res.status(401).json({
      message: "Yetkisiz işlem",
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Geçersiz veri formatı",
    });
  }

  if (err.code === 11000) {
    // Duplicate key error (MongoDB)
    return res.status(409).json({
      message: "Bu kayıt zaten mevcut",
    });
  }

  // Generic error response (don't leak details)
  const statusCode = err.statusCode || err.status || 500;
  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(statusCode).json({
    message: isDevelopment 
      ? err.message 
      : "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
    ...(isDevelopment && { stack: err.stack }),
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create a safe error response
 */
export const createErrorResponse = (message, statusCode = 500) => {
  return {
    message,
    statusCode,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Safe error message formatter
 * Removes sensitive information
 */
export const sanitizeErrorMessage = (error) => {
  const safeMessages = {
    "MongoServerError": "Veritabanı hatası",
    "ValidationError": "Geçersiz veri",
    "CastError": "Geçersiz veri formatı",
    "JsonWebTokenError": "Geçersiz token",
    "TokenExpiredError": "Token süresi dolmuş",
  };

  return safeMessages[error.name] || "Bir hata oluştu";
};


