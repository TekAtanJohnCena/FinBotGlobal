// PATH: backend/src/routes/api.js
import express from 'express';
import tiingoClient from '../services/tiingo/tiingoClient.js';
import { getPrice } from '../services/tiingo/stockService.js';
import { getFundamentals } from '../services/tiingo/fundamentalsService.js';
import axios from 'axios';

const router = express.Router();
const TIINGO_API_KEY = process.env.TIINGO_API_KEY;

/**
 * A) GET /api/screener-fundamentals
 * Merges Daily Price and Fundamentals for major stocks
 */
router.get('/screener-fundamentals', async (req, res) => {
    const tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'JPM', 'V', 'META'];

    try {
        const results = await Promise.all(tickers.map(async (ticker) => {
            try {
                // Fetch basic info and price
                // Using Tiingo Daily endpoint for meta and stats if available, or combining services
                const priceData = await getPrice(ticker);

                // Fetch fundamentals for P/E, Market Cap, etc.
                // Note: Market cap might be available in daily meta or calculated
                let marketCap = 0;
                let peRatio = 0;
                let dividendYield = 0;

                try {
                    // We'll try to get fundamentals for professional stats
                    // If the user's Tiingo key doesn't have fundamentals access, we provide fallback/empty
                    const fundamentals = await getFundamentals(ticker);
                    // Extract or calculate required fields
                    // This is a simplification, actual fields depend on Tiingo response structure
                    marketCap = fundamentals.marketCap || 0;
                    peRatio = fundamentals.peRatio || 0;
                    dividendYield = fundamentals.dividendYield || 0;
                } catch (fErr) {
                    console.warn(`Could not fetch fundamentals for ${ticker}:`, fErr.message);
                }

                return {
                    symbol: ticker,
                    name: ticker, // Could be fetched from a profile service
                    lastPrice: priceData.price,
                    changePercent: priceData.changePercent,
                    marketCap: marketCap,
                    peRatio: peRatio,
                    dividendYield: dividendYield
                };
            } catch (err) {
                console.error(`Error fetching data for ${ticker}:`, err.message);
                return null;
            }
        }));

        const filteredResults = results.filter(r => r !== null);
        res.json({ ok: true, data: filteredResults });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

/**
 * B) GET /api/global-news
 * NASDAQ and NYSE focused news
 */
router.get('/global-news', async (req, res) => {
    try {
        const response = await axios.get('https://api.tiingo.com/tiingo/news', {
            params: {
                tags: 'technology,finance,ipo',
                limit: 20,
                token: TIINGO_API_KEY
            }
        });

        const news = response.data.map(item => ({
            id: item.id,
            title: item.title,
            summary: item.description,
            source: item.source,
            date: item.publishedDate,
            url: item.url,
            image: item.urlToImage // Tiingo might not provide images, depends on source
        }));

        res.json({ ok: true, data: news });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

/**
 * D) GET /api/stock-analysis/:symbol
 * Aggregates daily profile, historical prices, fundamentals, financials, and news
 */
router.get('/stock-analysis/:symbol', async (req, res) => {
    const { symbol } = req.params;
    const normalizedSymbol = symbol.toUpperCase();

    try {
        console.log(`Starting analysis for: ${normalizedSymbol}`);

        // Fetch 5 Sources in parallel (Parallel Request)
        const [metaRes, historyRes, fundamentalsRes, statementsRes, newsRes] = await Promise.allSettled([
            axios.get(`https://api.tiingo.com/tiingo/daily/${normalizedSymbol}?token=${TIINGO_API_KEY}`),
            axios.get(`https://api.tiingo.com/tiingo/daily/${normalizedSymbol}/prices?startDate=2024-01-01&token=${TIINGO_API_KEY}`),
            axios.get(`https://api.tiingo.com/tiingo/fundamentals/${normalizedSymbol}/daily?token=${TIINGO_API_KEY}`),
            axios.get(`https://api.tiingo.com/tiingo/fundamentals/${normalizedSymbol}/statements?sort=-date&token=${TIINGO_API_KEY}`),
            axios.get(`https://api.tiingo.com/tiingo/news?tickers=${normalizedSymbol}&limit=5&token=${TIINGO_API_KEY}`)
        ]);

        const meta = metaRes.status === 'fulfilled' ? metaRes.value.data : {};
        const history = historyRes.status === 'fulfilled' ? historyRes.value.data : [];
        const dailyFundamentals = fundamentalsRes.status === 'fulfilled' ? fundamentalsRes.value.data?.at(-1) : {};
        const statementsData = statementsRes.status === 'fulfilled' ? statementsRes.value.data : [];
        const news = newsRes.status === 'fulfilled' ? newsRes.value.data : [];

        // Debug Log
        console.log("Statements Verisi:", statementsData.length);

        // Extract latest financials summary
        const latestStatement = statementsData.length > 0 ? statementsData[0] : {};

        // Calculate current price and change from history
        let lastPrice = 0;
        let changePercent = 0;
        if (history.length > 0) {
            const last = history[history.length - 1];
            const prev = history.length > 1 ? history[history.length - 2] : last;
            lastPrice = last.close;
            changePercent = ((last.close - prev.close) / prev.close) * 100;
        }

        const data = {
            symbol: normalizedSymbol,
            name: meta.name || normalizedSymbol,
            price: lastPrice,
            changePercent: changePercent,
            history: history.map(item => ({
                date: item.date,
                price: item.close,
                high: item.high,
                low: item.low,
                volume: item.volume
            })),
            fundamentals: {
                marketCap: dailyFundamentals?.marketCap || 0,
                peRatio: dailyFundamentals?.peRatio || 0,
                dividendYield: dailyFundamentals?.dividendYield || 0,
                roe: dailyFundamentals?.roe || 0,
                beta: dailyFundamentals?.beta || 0,
                description: meta.description
            },
            financials: {
                summary: {
                    revenue: latestStatement.revenue || 0,
                    netIncome: latestStatement.netIncome || 0,
                },
                history: statementsData
            },
            news: news.map(item => ({
                id: item.id,
                title: item.title,
                source: item.source,
                date: item.publishedDate,
                url: item.url
            }))
        };

        res.json({ ok: true, data });
    } catch (error) {
        console.error(`Tiingo API Hatası (${normalizedSymbol}):`, error.response?.data || error.message);
        res.status(500).json({ ok: false, error: 'Analiz verileri alınamadı.' });
    }
});

export default router;
