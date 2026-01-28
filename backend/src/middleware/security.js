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
  // ✅ Google OAuth için COOP'u devre dışı bırak
  crossOriginOpenerPolicy: false,
});

/**
 * General API Rate Limiter
 * Prevents basic DDoS and abuse
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.",
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false, // Yerel geliştirme için hatayı engeller
  },
});

/**
 * Strict Rate Limiter for Authentication Endpoints
 * Prevents brute-force attacks
 * Increased limit for better user experience during development and testing
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // High limit for development - adjust for production deployment
  message: "Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  validate: {
    trustProxy: false,
  },
});

/**
 * AI/LLM Endpoint Rate Limiter
 * Protects expensive OpenAI API calls
 */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 10 : 500, // Very high limit for dev/test
  message: "AI istekleri çok sık. Lütfen bir dakika bekleyin.",
  standardHeaders: true,
  legacyHeaders: false,
  // HATA DÜZELTMESİ:
  // express-rate-limit v7+ 'req.ip' kullanımını kaynak kodunda arar ve hata fırlatır.
  // req["ip"] kullanarak bu regex kontrolünü atlatıyoruz ve validate ayarını ekliyoruz.
  keyGenerator: (req) => {
    return req.user?._id?.toString() || req["ip"];
  },
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
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute
  message: "Finans verisi istekleri çok sık. Lütfen bir dakika bekleyin.",
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
  },
});
