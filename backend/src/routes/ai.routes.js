// PATH: backend/src/routes/ai.routes.js
/**
 * AI Routes - Dedicated AI Endpoints
 * 
 * These routes are the ONLY place OpenAI is called.
 * All endpoints are:
 * - Protected by auth
 * - Rate limited (aiRateLimiter from security.js)
 * - User-triggered only (never auto-called)
 */

import express from "express";
import { protect } from "../middleware/auth.js";
import { aiRateLimiter } from "../middleware/security.js";
import {
    translateText,
    analyzeNews,
    analyzeStock,
    getCacheStats
} from "../controllers/aiController.js";

const router = express.Router();

/**
 * POST /api/ai/translate
 * Translate text to target language
 * Body: { text: string, targetLang: string }
 * 
 * Usage: User clicks "Translate" button on frontend
 */
router.post("/translate", protect, aiRateLimiter, translateText);

/**
 * POST /api/ai/news-analyze
 * Analyze news sentiment with AI
 * Body: { title: string, description?: string, symbol?: string }
 * 
 * Usage: User clicks "Analyze" button on news card
 */
router.post("/news-analyze", protect, aiRateLimiter, analyzeNews);

/**
 * POST /api/ai/stock-analyze
 * AI-powered stock scoring
 * Body: { ticker: string, priceData?: object, fundamentals?: object }
 * 
 * Usage: User clicks "AI Analysis" button on stock page
 */
router.post("/stock-analyze", protect, aiRateLimiter, analyzeStock);

/**
 * GET /api/ai/cache-stats
 * Get AI cache statistics (admin/debug)
 */
router.get("/cache-stats", protect, getCacheStats);

export default router;
