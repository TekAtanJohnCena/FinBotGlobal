// PATH: backend/src/controllers/aiController.js
/**
 * AI Controller - Centralized OpenAI Integration
 * 
 * All AI operations are handled here, NOT in data endpoints.
 * This ensures:
 * - Zero OpenAI calls on page load
 * - User-triggered AI only
 * - Proper caching (7-day TTL)
 * - Rate limit protection
 */

import "dotenv/config";
import { OpenAI } from "openai";
import aiCacheManager from "../utils/aiCacheManager.js";

// OpenAI Client - Single instance
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Language mappings
const LANG_NAMES = {
    tr: 'Turkish',
    ar: 'Arabic',
    de: 'German',
    fr: 'French',
    es: 'Spanish',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    ru: 'Russian',
    pt: 'Portuguese'
};

/**
 * Helper: Handle OpenAI errors properly
 * Returns appropriate HTTP status for 429 errors
 */
function handleOpenAIError(error, res) {
    const status = error.status || error.response?.status || 500;
    const errorCode = error.code || error.error?.code || 'UNKNOWN';
    const errorType = error.error?.type || error.type || 'unknown_error';
    const errorMessage = error.response?.data?.error?.message || error.message || 'AI service error';

    console.error(`❌ [AI] OpenAI Error (Status: ${status}, Code: ${errorCode})`);
    console.error(`❌ [AI] Detail: ${errorMessage}`);

    // Return 429 to client if OpenAI rate limited
    if (status === 429) {
        return res.status(429).json({
            ok: false,
            error: 'AI usage limit reached. Please try again later.',
            errorCode: 'RATE_LIMIT_EXCEEDED',
            retryAfter: 60
        });
    }

    return res.status(500).json({
        ok: false,
        error: errorMessage,
        errorCode: errorCode
    });
}

/**
 * POST /api/ai/translate
 * Translate text to target language
 * 
 * Body: { text: string, targetLang: string }
 */
export async function translateText(req, res) {
    try {
        const { text, targetLang } = req.body;

        // Validation
        if (!text || typeof text !== 'string') {
            return res.status(400).json({ ok: false, error: 'Text is required' });
        }

        if (!targetLang || !LANG_NAMES[targetLang]) {
            return res.status(400).json({
                ok: false,
                error: 'Invalid target language',
                supportedLanguages: Object.keys(LANG_NAMES)
            });
        }

        // Return original if English
        if (targetLang === 'en') {
            return res.json({ ok: true, translation: text, cached: false });
        }

        // Check cache first (7-day TTL)
        const cachedTranslation = aiCacheManager.getTranslation(text, targetLang);
        if (cachedTranslation) {
            console.log(`📦 [AI] Translation cache hit for ${targetLang}`);
            return res.json({ ok: true, translation: cachedTranslation, cached: true });
        }

        // Call OpenAI
        console.log(`🌐 [AI] Translating to ${LANG_NAMES[targetLang]}...`);

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are a professional translator. Translate the following text to ${LANG_NAMES[targetLang]}. Keep it professional and accurate. Return ONLY the translated text, nothing else.`
                },
                { role: 'user', content: text }
            ],
            temperature: 0.3,
            max_tokens: 2000
        });

        const translation = completion.choices[0]?.message?.content?.trim() || text;

        // Cache the translation
        aiCacheManager.setTranslation(text, targetLang, translation);

        console.log(`✅ [AI] Translation complete (${translation.length} chars)`);

        res.json({ ok: true, translation, cached: false });

    } catch (error) {
        return handleOpenAIError(error, res);
    }
}

/**
 * POST /api/ai/news-analyze
 * Analyze news sentiment
 * 
 * Body: { title: string, description?: string, symbol?: string }
 */
export async function analyzeNews(req, res) {
    try {
        const { title, description, symbol } = req.body;

        if (!title) {
            return res.status(400).json({ ok: false, error: 'News title is required' });
        }

        // Create unique news ID for caching
        const newsId = `${symbol || 'general'}_${title}`;

        // Check cache first
        const cachedAnalysis = aiCacheManager.getNewsAnalysis(newsId);
        if (cachedAnalysis) {
            console.log(`📦 [AI] News analysis cache hit`);
            return res.json({ ok: true, data: cachedAnalysis, cached: true });
        }

        const newsText = `${title}\n\n${description || ''}`.trim();

        console.log(`🤖 [AI] Analyzing news for ${symbol || 'general'}...`);

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are an expert financial analyst. Read the given news and analyze its short-term impact on the related stock. 
                    
Respond in this format:
SENTIMENT: [POSITIVE/NEGATIVE/NEUTRAL]
ANALYSIS: [2-3 sentence explanation in Turkish]

Be professional and objective.`
                },
                {
                    role: "user",
                    content: `Stock: ${symbol || 'Not specified'}\nNews: ${newsText}`
                }
            ],
            temperature: 0.3,
            max_tokens: 300
        });

        const aiResponse = completion.choices[0].message.content;

        // Parse response
        const sentimentMatch = aiResponse.match(/SENTIMENT:\s*(POSITIVE|NEGATIVE|NEUTRAL)/i);
        const analysisMatch = aiResponse.match(/ANALYSIS:\s*(.+)/is);

        const result = {
            sentiment: sentimentMatch ? sentimentMatch[1].toUpperCase() : 'NEUTRAL',
            analysis: analysisMatch ? analysisMatch[1].trim() : aiResponse,
            timestamp: new Date().toISOString()
        };

        // Cache the analysis
        aiCacheManager.setNewsAnalysis(newsId, result);

        console.log(`✅ [AI] News analysis complete: ${result.sentiment}`);

        res.json({ ok: true, data: result, cached: false });

    } catch (error) {
        return handleOpenAIError(error, res);
    }
}

/**
 * POST /api/ai/stock-analyze
 * AI-powered stock scoring and analysis
 * 
 * Body: { ticker: string, priceData?: object, fundamentals?: object }
 */
export async function analyzeStock(req, res) {
    try {
        const { ticker, priceData, fundamentals } = req.body;

        if (!ticker) {
            return res.status(400).json({ ok: false, error: 'Ticker is required' });
        }

        const normalizedTicker = ticker.toUpperCase().replace('.IS', '');

        // Check cache first (24-hour TTL for stock analysis)
        const cachedAnalysis = aiCacheManager.getStockAnalysis(normalizedTicker);
        if (cachedAnalysis) {
            console.log(`📦 [AI] Stock analysis cache hit for ${normalizedTicker}`);
            return res.json({ ok: true, data: cachedAnalysis, cached: true });
        }

        // Build data block for AI
        const dataBlock = `
STOCK: ${normalizedTicker}

PRICE DATA:
- Current Price: $${priceData?.price?.toFixed(2) || 'N/A'}
- Daily Change: ${priceData?.changePercent?.toFixed(2) || '0'}%

FUNDAMENTALS:
- P/E Ratio: ${fundamentals?.peRatio || 'N/A'}
- P/B Ratio: ${fundamentals?.pbRatio || 'N/A'}
- ROE: ${fundamentals?.roe || 'N/A'}%
- Market Cap: ${fundamentals?.marketCap || 'N/A'}
`.trim();

        console.log(`🤖 [AI] Analyzing stock ${normalizedTicker}...`);

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.3,
            max_tokens: 600,
            messages: [
                {
                    role: "system",
                    content: `You are FinBot, an advanced financial analyst. Analyze stocks and return ONLY valid JSON.

SCORING RULES:
- Score 0-4: Weak/Underperforming
- Score 5-7: Neutral/Average
- Score 8-10: Strong/Outperforming

REQUIRED JSON FORMAT (return ONLY this, no other text):
{
  "score": 7.5,
  "score_label": "Strong",
  "metrics": [
    {
      "title": "Valuation",
      "value": "Fair",
      "detail": "Brief analysis...",
      "sentiment": "positive"
    }
  ],
  "ai_verdict": "Brief 2-3 sentence summary..."
}

Include metrics for: Valuation, Profitability, Growth, Financial Health.
Sentiment must be: "positive", "neutral", or "negative".`
                },
                {
                    role: "user",
                    content: `Analyze this stock and return JSON only:\n\n${dataBlock}`
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = completion.choices?.[0]?.message?.content?.trim() || "{}";
        let parsed;

        try {
            parsed = JSON.parse(content);
        } catch {
            parsed = { score: 5, score_label: "Neutral", metrics: [], ai_verdict: "Analysis unavailable." };
        }

        // Normalize response
        const result = {
            ticker: normalizedTicker,
            score: Math.max(0, Math.min(10, Number(parsed.score?.toFixed?.(1)) || 5)),
            scoreLabel: parsed.score_label || (parsed.score >= 8 ? "Strong" : parsed.score >= 5 ? "Neutral" : "Weak"),
            metrics: Array.isArray(parsed.metrics) ? parsed.metrics.slice(0, 5) : [],
            aiVerdict: parsed.ai_verdict?.substring(0, 300) || "Analysis completed.",
            timestamp: new Date().toISOString()
        };

        // Cache the analysis
        aiCacheManager.setStockAnalysis(normalizedTicker, result);

        console.log(`✅ [AI] Stock analysis complete: ${normalizedTicker} = ${result.score}`);

        res.json({ ok: true, data: result, cached: false });

    } catch (error) {
        return handleOpenAIError(error, res);
    }
}

/**
 * GET /api/ai/cache-stats
 * Get AI cache statistics (admin/debug)
 */
export async function getCacheStats(req, res) {
    const stats = aiCacheManager.getStats();
    res.json({ ok: true, stats });
}

export default {
    translateText,
    analyzeNews,
    analyzeStock,
    getCacheStats
};
