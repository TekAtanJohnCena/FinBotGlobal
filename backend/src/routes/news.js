// PATH: backend/src/routes/news.js
import express from 'express';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const TIINGO_API_KEY = process.env.TIINGO_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Google Gemini AI istemcisini başlat
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * GET /api/news/:symbol
 * Get news for a specific stock symbol
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
 * POST /api/news/analyze
 * AI-powered sentiment analysis using Google Gemini
 */
router.post('/analyze', protect, async (req, res) => {
    const { title, description, symbol } = req.body;

    if (!title && !description) {
        return res.status(400).json({
            ok: false,
            error: 'News title or description is required.'
        });
    }

    try {
        const newsText = `${title}\n\n${description || ''}`.trim();

        const systemPrompt = `Sen uzman bir finansal analistsin ve haber analizi konusunda deneyimlisin. 
Verilen haberi oku ve bu haberin ${symbol || 'ilgili hisse senedi'} için kısa vadede (1-7 gün) nasıl bir etki yaratacağını analiz et.

Cevabını şu formatta ver:
SENTIMENT: [POSITIVE/NEGATIVE/NEUTRAL]
ANALYSIS: [2-3 cümle ile açıklama]

Önemli: Cevabını Türkçe ver ve profesyonel bir ton kullan.`;

        // Gemini modelini al (gemini-pro stable ve geniş destek)
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `${systemPrompt}\n\nHaber: ${newsText}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiResponse = response.text();

        // Parse the response
        const sentimentMatch = aiResponse.match(/SENTIMENT:\s*(POSITIVE|NEGATIVE|NEUTRAL)/i);
        const analysisMatch = aiResponse.match(/ANALYSIS:\s*(.+)/is);

        const sentiment = sentimentMatch ? sentimentMatch[1].toUpperCase() : 'NEUTRAL';
        const analysis = analysisMatch ? analysisMatch[1].trim() : aiResponse;

        res.json({
            ok: true,
            data: {
                sentiment: sentiment,
                analysis: analysis,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('AI Analysis error:', error.message);
        res.status(500).json({
            ok: false,
            error: 'AI analysis failed. Please try again.'
        });
    }
});

export default router;
