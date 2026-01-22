// PATH: backend/src/middleware/errorHandler.js
/**
 * Global Error Handler Middleware
 * Catches all async errors and formats responses based on environment
 */

import logger from "../utils/logger.js";

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Not Found Handler
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

/**
 * Global Error Handler
 * Formats error responses based on environment
 */
export const errorHandler = (err, req, res, next) => {
    // Default status code
    let statusCode = err.statusCode || err.status || 500;

    // Log error in development
    if (process.env.NODE_ENV !== 'production') {
        logger.error(`❌ Error: ${err.message}`);
        logger.error(`Stack: ${err.stack}`);
    } else {
        // Log only essential info in production
        logger.error(`❌ ${statusCode} ${req.method} ${req.originalUrl}: ${err.message}`);
    }

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
    } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
        statusCode = 401;
    } else if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 400;
        err.message = 'Invalid ID format';
    } else if (err.code === 11000) {
        // MongoDB duplicate key error
        statusCode = 400;
        err.message = 'Duplicate entry found';
    }

    // Format response based on environment
    const response = {
        ok: false,
        error: statusCode >= 500 ? 'Server Error' : 'Request Error',
        message: process.env.NODE_ENV === 'production' && statusCode >= 500
            ? 'Something went wrong. Please try again later.'
            : err.message
    };

    // Add stack trace in development
    if (process.env.NODE_ENV !== 'production') {
        response.stack = err.stack;
        response.details = {
            name: err.name,
            code: err.code,
            statusCode
        };
    }

    res.status(statusCode).json(response);
};

/**
 * Custom Error Classes
 */
export class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
        this.name = 'ValidationError';
    }
}

export class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401);
        this.name = 'AuthenticationError';
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
        this.name = 'NotFoundError';
    }
}

export class RateLimitError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, 429);
        this.name = 'RateLimitError';
    }
}

export default {
    asyncHandler,
    notFoundHandler,
    errorHandler,
    AppError,
    ValidationError,
    AuthenticationError,
    NotFoundError,
    RateLimitError
};
