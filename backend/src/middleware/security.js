// PATH: backend/src/middleware/security.js
// Comprehensive Security Middleware

import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

/**
 * Security Headers Middleware
 * Implements OWASP security best practices
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // Allow Google OAuth popup postMessage
  crossOriginEmbedderPolicy: false,
});

/**
 * General API Rate Limiter
 * Prevents basic DDoS and abuse
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Cok fazla istek gonderdiniz. Lutfen daha sonra tekrar deneyin.",
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
  },
});

const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_MAX_ATTEMPTS = 100;

const createAuthLimiter = (message) =>
  rateLimit({
    windowMs: AUTH_WINDOW_MS,
    max: AUTH_MAX_ATTEMPTS,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    validate: {
      trustProxy: false,
    },
  });

/**
 * Endpoint-specific auth limiters
 */
export const loginRateLimiter = createAuthLimiter(
  "Cok fazla giris denemesi. Lutfen 15 dakika sonra tekrar deneyin."
);

export const registerRateLimiter = createAuthLimiter(
  "Cok fazla kayit denemesi. Lutfen 15 dakika sonra tekrar deneyin."
);

// Backward compatibility for existing imports
export const authRateLimiter = loginRateLimiter;

/**
 * AI/LLM Endpoint Rate Limiter
 * Protects expensive AI calls
 */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === "production" ? 10 : 500,
  message: "AI istekleri cok sik. Lutfen bir dakika bekleyin.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?._id?.toString() || req["ip"];
  },
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
  },
});

/**
 * Chat endpoint limiter
 * /api/chat -> max 10 requests per minute per IP
 */
export const chatMessageRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Cok fazla chat mesaji gonderdiniz. Lutfen bir dakika bekleyin.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req["ip"],
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
  },
});

/**
 * Price/Finance API Rate Limiter
 * Prevents scraping and API abuse
 */
export const financeRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: "Finans verisi istekleri cok sik. Lutfen bir dakika bekleyin.",
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
  },
});
