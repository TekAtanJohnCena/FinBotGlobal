// PATH: backend/src/routes/api.js
import express from 'express';
import axios from 'axios';

const router = express.Router();
const TIINGO_API_KEY = process.env.TIINGO_API_KEY;

// Helper: Determine Asset Type
const getAssetType = (symbol) => {
    const s = symbol.toLowerCase();
    const cryptoTickers = ['btcusd', 'ethusd', 'solusd', 'dogeusd', 'xrpusd', 'bnbusd', 'ltcusd', 'adausd', 'matikusd'];
    const forexTickers = ['eurusd', 'gbpusd', 'usdjpy', 'usdtry', 'audusd', 'usdcad', 'xauusd'];

    if (cryptoTickers.includes(s) || (s.endsWith('usd') && s.length >= 6)) return 'CRYPTO';
    if (forexTickers.includes(s)) return 'FOREX';
    return 'STOCK';
};

/**
 * A) GET /api/screener-fundamentals
 * Enhanced with better price fallbacks
 */
router.get('/screener-fundamentals', async (req, res) => {
    const tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'JPM', 'V', 'META'];
    try {
        const results = await Promise.all(tickers.map(async (ticker) => {
            try {
                const [priceRes, fundRes] = await Promise.all([
                    axios.get(`https://api.tiingo.com/iex/?tickers=${ticker}&token=${TIINGO_API_KEY}`),
                    axios.get(`https://api.tiingo.com/tiingo/fundamentals/${ticker}/daily?token=${TIINGO_API_KEY}`)
                ]);
                const p = priceRes.data[0] || {};
                const f = fundRes.data?.at(-1) || {};

                // Use robust price detection
                const lastPrice = p.last || p.tngoLast || p.prevClose || 0;
                const changeP = p.prevClose ? ((lastPrice - p.prevClose) / p.prevClose) * 100 : 0;

                return {
                    symbol: ticker,
                    name: ticker,
                    lastPrice: lastPrice,
                    changePercent: changeP,
                    marketCap: f.marketCap || 0,
                    peRatio: f.peRatio || 0,
                    dividendYield: f.dividendYield || 0
                };
            } catch (err) {
                console.error(`Error in screener ticker ${ticker}:`, err.message);
                return null;
            }
        }));
        res.json({ ok: true, data: results.filter(r => r !== null) });
    } catch (error) {
        res.status(500).json({ ok: false, error: 'Screener data fetch failed.' });
    }
});

/**
 * B) GET /api/global-news
 */
router.get('/global-news', async (req, res) => {
    try {
        const response = await axios.get('https://api.tiingo.com/tiingo/news', {
            params: { tags: 'technology,finance', limit: 20, token: TIINGO_API_KEY }
        });
        res.json({ ok: true, data: response.data });
    } catch (error) {
        res.status(500).json({ ok: false, error: 'News fetch failed.' });
    }
});

/**
 * C) GET /api/stock-analysis/:symbol
 */
router.get('/stock-analysis/:symbol', async (req, res) => {
    const { symbol } = req.params;
    const normalizedSymbol = symbol.toLowerCase();
    const type = getAssetType(normalizedSymbol);
    const startDate = '2024-01-01';

    try {
        let responseData = {
            symbol: symbol.toUpperCase(),
            type: type,
            price: 0,
            changePercent: 0,
            history: [],
            fundamentals: { marketCap: 0, peRatio: 0, dividendYield: 0, roe: 0, beta: 0, description: "" },
            financials: { summary: { revenue: 0, netIncome: 0 }, history: [] },
            news: []
        };

        if (type === 'CRYPTO') {
            const [priceRes, historyRes] = await Promise.all([
                axios.get(`https://api.tiingo.com/tiingo/crypto/prices?tickers=${normalizedSymbol}&token=${TIINGO_API_KEY}`),
                axios.get(`https://api.tiingo.com/tiingo/crypto/prices?tickers=${normalizedSymbol}&startDate=${startDate}&resampleFreq=1day&token=${TIINGO_API_KEY}`)
            ]);
            const cryptoPriceData = priceRes.data[0]?.priceData?.at(-1) || {};
            const cryptoHistoryRaw = historyRes.data[0]?.priceData || [];
            responseData.price = cryptoPriceData.last || 0;
            responseData.history = cryptoHistoryRaw.map(h => ({ date: h.date, price: h.close }));
        } else if (type === 'FOREX') {
            const [priceRes, historyRes] = await Promise.all([
                axios.get(`https://api.tiingo.com/tiingo/fx/top?tickers=${normalizedSymbol}&token=${TIINGO_API_KEY}`),
                axios.get(`https://api.tiingo.com/tiingo/fx/prices?tickers=${normalizedSymbol}&startDate=${startDate}&resampleFreq=1day&token=${TIINGO_API_KEY}`)
            ]);
            const fxPriceData = priceRes.data[0] || {};
            const fxHistoryRaw = historyRes.data || [];
            responseData.price = fxPriceData.lastPrice || fxPriceData.midPrice || fxPriceData.last || 0;
            responseData.history = fxHistoryRaw.map(h => ({ date: h.date, price: h.close || h.mid }));
        } else {
            const [metaRes, priceHistoryRes, dailyFundRes, statementsRes, newsRes] = await Promise.allSettled([
                axios.get(`https://api.tiingo.com/tiingo/daily/${normalizedSymbol}?token=${TIINGO_API_KEY}`),
                axios.get(`https://api.tiingo.com/tiingo/daily/${normalizedSymbol}/prices?startDate=${startDate}&token=${TIINGO_API_KEY}`),
                axios.get(`https://api.tiingo.com/tiingo/fundamentals/${normalizedSymbol}/daily?token=${TIINGO_API_KEY}`),
                axios.get(`https://api.tiingo.com/tiingo/fundamentals/${normalizedSymbol}/statements?sort=-date&token=${TIINGO_API_KEY}`),
                axios.get(`https://api.tiingo.com/tiingo/news?tickers=${normalizedSymbol}&limit=5&token=${TIINGO_API_KEY}`)
            ]);

            const meta = metaRes.status === 'fulfilled' ? metaRes.value.data : {};
            const historyRaw = priceHistoryRes.status === 'fulfilled' ? priceHistoryRes.value.data : [];
            const dailyFund = dailyFundRes.status === 'fulfilled' ? dailyFundRes.value.data?.at(-1) : {};
            const rawStatements = statementsRes.status === 'fulfilled' ? statementsRes.value.data : [];
            const newsData = newsRes.status === 'fulfilled' ? newsRes.value.data : [];

            if (historyRaw.length > 0) {
                const last = historyRaw.at(-1);
                responseData.price = last.close;
                responseData.history = historyRaw.map(h => ({ date: h.date, price: h.close }));
            }
            responseData.fundamentals = {
                marketCap: dailyFund.marketCap || meta.marketCap || 0,
                peRatio: dailyFund.peRatio || 0,
                dividendYield: dailyFund.dividendYield || 0,
                roe: dailyFund.roe || 0,
                beta: dailyFund.beta || 0,
                description: meta.description || ""
            };
            const annuals = rawStatements.filter(s => s.quarter === 0);
            responseData.financials.history = annuals.map(s => ({
                date: s.date, year: s.year, revenue: s.statementData?.totalRevenue || 0, netIncome: s.statementData?.netIncome || 0
            }));
            responseData.financials.summary = {
                revenue: responseData.financials.history[0]?.revenue || 0, netIncome: responseData.financials.history[0]?.netIncome || 0
            };
            responseData.news = newsData;
        }

        if (responseData.history.length > 1) {
            const last = responseData.history.at(-1).price;
            const prev = responseData.history.at(-2).price;
            responseData.changePercent = prev ? ((last - prev) / prev) * 100 : 0;
        }

        res.json({ ok: true, data: responseData });
    } catch (error) {
        res.status(500).json({ ok: false, error: 'Failed to analyze asset.' });
    }
});

export default router;
