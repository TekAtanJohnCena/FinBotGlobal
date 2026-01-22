// PATH: backend/src/middleware/rateLimiter.js
/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse and manages Tiingo API quota
 */

import { rateLimit } from 'express-rate-limit'; // Import düzeltildi

/**
 * General API Rate Limiter
 * 100 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // max is now limit in v7+
    standardHeaders: 'draft-7', // Modern header standardı
    legacyHeaders: false,
    message: {
        ok: false,
        error: 'Too many requests',
        message: 'You have exceeded the rate limit. Please try again in 15 minutes.'
    },
    handler: (req, res, next, options) => {
        console.warn(`⚠️ Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            ok: false,
            error: 'Too many requests',
            message: options.message.message,
            retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
        });
    }
});

/**
 * Tiingo Proxy Rate Limiter
 * Stricter limit for Tiingo API calls (500 requests per hour)
 */
export const tiingoLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 500,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // keyGenerator KALDIRILDI (Hata kaynağı buydu)
    message: {
        ok: false,
        error: 'Tiingo API quota exceeded',
        message: 'Market data requests are limited to 500 per hour.'
    },
    handler: (req, res, next, options) => {
        console.warn(`⚠️ Tiingo rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            ok: false,
            error: 'Market data quota exceeded',
            message: options.message.message,
            retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
        });
    }
});

/**
 * AI/Chat Rate Limiter
 * Stricter limit for AI-powered endpoints
 */
export const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // keyGenerator KALDIRILDI (Hata kaynağı buydu)
    message: {
        ok: false,
        error: 'AI request limit exceeded',
        message: 'FinBot needs a short break. Please try again in a few minutes.'
    },
    handler: (req, res, next, options) => {
        console.warn(`⚠️ AI rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            ok: false,
            error: 'AI request limit exceeded',
            message: options.message.message,
            retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
        });
    }
});

/**
 * Auth Rate Limiter
 * Very strict limit for login/register
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5, // Strict limit for auth endpoints
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        ok: false,
        error: 'Too many login attempts',
        message: 'Too many authentication attempts. Please try again in 15 minutes.'
    },
    handler: (req, res, next, options) => {
        console.warn(`⚠️ Auth rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            ok: false,
            error: 'Too many attempts',
            message: options.message.message,
            retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
        });
    }
});

export default {
    generalLimiter,
    tiingoLimiter,
    aiLimiter,
    authLimiter
};