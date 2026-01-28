// PATH: backend/src/routes/news.js
/**
 * News Routes - Tiingo News API
 * NOTE: OpenAI analysis moved to /api/ai/news-analyze
 */

import express from 'express';
import axios from 'axios';
import { protect } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/security.js';
import { checkNewsQuota, incrementNewsUsage } from '../middleware/quotaMiddleware.js';
import { analyzeNews } from '../controllers/aiController.js';

const router = express.Router();
const TIINGO_API_KEY = process.env.TIINGO_API_KEY;

/**
 * GET /api/news/:symbol
 * Get news for a specific stock symbol (NO AI)
 */
router.get('/:symbol', async (req, res) => {
    const { symbol } = req.params;
    const limit = req.query.limit || 10;

    try {
        const response = await axios.get('https://api.tiingo.com/tiingo/news', {
            params: {
                tickers: symbol.toUpperCase(),
                limit: limit,
                token: TIINGO_API_KEY
            }
        });

        const news = response.data.map(item => ({
            id: item.id,
            title: item.title,
            description: item.description,
            source: item.source,
            publishedDate: item.publishedDate,
            url: item.url,
            tickers: item.tickers
        }));

        res.json({ ok: true, data: news });
    } catch (error) {
        console.error('News fetch error:', error.message);
        res.status(500).json({ ok: false, error: 'Failed to fetch news.' });
    }
});

/**
 * GET /api/news/general/latest
 * Get latest general news
 */
router.get('/general/latest', async (req, res) => {
    const limit = req.query.limit || 20;

    try {
        const response = await axios.get('https://api.tiingo.com/tiingo/news', {
            params: {
                tags: 'technology,finance',
                limit: limit,
                token: TIINGO_API_KEY
            }
        });

        const news = response.data.map(item => ({
            id: item.id,
            title: item.title,
            description: item.description,
            source: item.source,
            publishedDate: item.publishedDate,
            url: item.url,
            tickers: item.tickers
        }));

        res.json({ ok: true, data: news });
    } catch (error) {
        console.error('General news fetch error:', error.message);
        res.status(500).json({ ok: false, error: 'Failed to fetch news.' });
    }
});

/**
 * POST /api/news/analyze
 * BACKWARD COMPATIBILITY: Proxies to /api/ai/news-analyze
 * Frontend should migrate to /api/ai/news-analyze
 */
router.post('/analyze', protect, aiRateLimiter, checkNewsQuota, async (req, res) => {
    console.log('⚠️ DEPRECATED: /api/news/analyze called. Use /api/ai/news-analyze instead.');

    // Proxy to the new AI controller
    try {
        await analyzeNews(req, res);
        // Increment quota on success
        if (req.user?._id) {
            await incrementNewsUsage(req.user._id);
        }
    } catch (error) {
        // Error already handled by analyzeNews
    }
});

export default router;
