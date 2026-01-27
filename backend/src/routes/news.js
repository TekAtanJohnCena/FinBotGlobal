// PATH: backend/src/routes/news.js
import express from 'express';
import axios from 'axios';
import { OpenAI } from 'openai';
import { protect } from '../middleware/auth.js';
import { checkNewsQuota, incrementNewsUsage } from '../middleware/quotaMiddleware.js';

const router = express.Router();
const TIINGO_API_KEY = process.env.TIINGO_API_KEY;

// 🔧 OPENAI INTEGRATION
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
 * AI-powered sentiment analysis using OpenAI
 * Protected by news analysis quota
 */
router.post('/analyze', protect, checkNewsQuota, async (req, res) => {
    const { title, description, symbol } = req.body;

    if (!title && !description) {
        return res.status(400).json({
            ok: false,
            error: 'News title or description is required.'
        });
    }

    try {
        const newsText = `${title}\n\n${description || ''}`.trim();

        console.log('🤖 OpenAI Analizi Başlıyor...');
        console.log(`📊 Sembol: ${symbol || 'Genel'}`);

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "Sen uzman bir finansal analistsin. Verilen haberi oku ve bu haberin ilgili hisse senedi üzerindeki kısa vadeli etkisini analiz et. Cevabını şu formatta ver:\nSENTIMENT: [POSITIVE/NEGATIVE/NEUTRAL]\nANALYSIS: [2-3 cümle ile açıklama]\nCevabını Türkçe ver ve profesyonel bir ton kullan."
                },
                {
                    role: "user",
                    content: `Hisse: ${symbol || 'Belirtilmedi'}\nHaber: ${newsText}`
                }
            ],
            temperature: 0.3,
            max_tokens: 200
        });

        const aiResponse = completion.choices[0].message.content;
        console.log('✅ OpenAI yanıtı alındı.');

        // Parse the response
        const sentimentMatch = aiResponse.match(/SENTIMENT:\s*(POSITIVE|NEGATIVE|NEUTRAL)/i);
        const analysisMatch = aiResponse.match(/ANALYSIS:\s*(.+)/is);

        const sentiment = sentimentMatch ? sentimentMatch[1].toUpperCase() : 'NEUTRAL';
        const analysis = analysisMatch ? analysisMatch[1].trim() : aiResponse;

        // Başarılı analiz sonrası kota kullanımını artır
        await incrementNewsUsage(req.user._id);

        res.json({
            ok: true,
            data: {
                sentiment: sentiment,
                analysis: analysis,
                timestamp: new Date().toISOString()
            },
            quotaInfo: req.quotaInfo
        });

    } catch (error) {
        console.error('❌ OpenAI Analysis error:', error.message);
        res.status(500).json({
            ok: false,
            error: `AI analizi başarısız oldu: ${error.message}`
        });
    }
});

export default router;

