// PATH: backend/src/routes/api.js
import express from 'express';
import axios from 'axios';

const router = express.Router();
const TIINGO_API_KEY = process.env.TIINGO_API_KEY;

/**
 * A) GET /api/screener-fundamentals
 * Merges Daily Price and Fundamentals for major stocks directly from Tiingo
 */
router.get('/screener-fundamentals', async (req, res) => {
    const tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'JPM', 'V', 'META'];

    try {
        const results = await Promise.all(tickers.map(async (ticker) => {
            try {
                // Real IEX Price
                const priceRes = await axios.get(`https://api.tiingo.com/iex/?tickers=${ticker}&token=${TIINGO_API_KEY}`);
                const p = priceRes.data[0] || {};

                // Real Fundamentals
                const fundRes = await axios.get(`https://api.tiingo.com/tiingo/fundamentals/${ticker}/daily?token=${TIINGO_API_KEY}`);
                const latestFund = fundRes.data?.at(-1) || {};

                return {
                    symbol: ticker,
                    name: ticker,
                    lastPrice: p.last || 0,
                    changePercent: p.prevClose ? ((p.last - p.prevClose) / p.prevClose) * 100 : 0,
                    marketCap: latestFund.marketCap || 0,
                    peRatio: latestFund.peRatio || 0,
                    dividendYield: latestFund.dividendYield || 0
                };
            } catch (err) {
                console.error(`❌ Screener API Hata (${ticker}):`, err.message);
                return null;
            }
        }));

        res.json({ ok: true, data: results.filter(r => r !== null) });
    } catch (error) {
        res.status(500).json({ ok: false, error: 'Screener verileri alınamadı.' });
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

        const news = response.data.map(item => ({
            id: item.id,
            title: item.title,
            source: item.source,
            date: item.publishedDate,
            url: item.url
        }));

        res.json({ ok: true, data: news });
    } catch (error) {
        res.status(500).json({ ok: false, error: 'Haberler alınamadı.' });
    }
});

/**
 * D) GET /api/stock-analysis/:symbol
 * PRODUCTION READY: No mock data, Annual Filtering, Detailed Mapping
 */
router.get('/stock-analysis/:symbol', async (req, res) => {
    const { symbol } = req.params;
    const normalizedSymbol = symbol.toUpperCase();

    console.log(`\n--- 📡 ÜRETİM MODU İSTEK: ${normalizedSymbol} ---`);

    try {
        // Fetch 5 Sources in parallel
        const [metaRes, historyRes, fundamentalsRes, statementsRes, newsRes] = await Promise.allSettled([
            axios.get(`https://api.tiingo.com/tiingo/daily/${normalizedSymbol}?token=${TIINGO_API_KEY}`),
            axios.get(`https://api.tiingo.com/tiingo/daily/${normalizedSymbol}/prices?startDate=2024-01-01&token=${TIINGO_API_KEY}`),
            axios.get(`https://api.tiingo.com/tiingo/fundamentals/${normalizedSymbol}/daily?token=${TIINGO_API_KEY}`),
            axios.get(`https://api.tiingo.com/tiingo/fundamentals/${normalizedSymbol}/statements?sort=-date&token=${TIINGO_API_KEY}`),
            axios.get(`https://api.tiingo.com/tiingo/news?tickers=${normalizedSymbol}&limit=5&token=${TIINGO_API_KEY}`)
        ]);

        // LOG STATUS
        const log = (name, res) => console.log(res.status === 'fulfilled' ? `✅ ${name}` : `❌ ${name} [${res.reason?.response?.status || 'ERR'}]`);
        log("META      ", metaRes);
        log("HISTORY   ", historyRes);
        log("Ratios    ", fundamentalsRes);
        log("Statements", statementsRes);
        log("News      ", newsRes);

        const meta = metaRes.status === 'fulfilled' ? metaRes.value.data : {};
        const history = historyRes.status === 'fulfilled' ? historyRes.value.data : [];
        const dailyFundamentals = fundamentalsRes.status === 'fulfilled' ? fundamentalsRes.value.data?.at(-1) : {};
        const rawStatements = statementsRes.status === 'fulfilled' ? statementsRes.value.data : [];
        const newsData = newsRes.status === 'fulfilled' ? newsRes.value.data : [];

        // 1. ANNUAL FILTERING & DEBUGGING
        if (rawStatements.length > 0) {
            console.log("🔍 Tiingo İçerik Örneği:", JSON.stringify(rawStatements[0].statementData, null, 2).slice(0, 500));
        }

        // Sadece 'quarter: 0' (Yıllık) olanları filtrele. Yoksa hepsini al.
        let filteredStatements = rawStatements.filter(item => item.quarter === 0);
        if (filteredStatements.length === 0) {
            console.log("⚠️ Yıllık rapor (quarter=0) bulunamadı, tüm periyotlar kullanılıyor.");
            filteredStatements = rawStatements;
        } else {
            console.log(`📊 Yıllık Filtreleme: ${filteredStatements.length} adet yıl bulundu.`);
        }

        // 2. ROBUST MAPPING (Kutuyu Aç)
        const cleanFinancials = filteredStatements.map(item => {
            const d = item.statementData || {};
            return {
                date: item.date,
                year: item.year,
                quarter: item.quarter,
                // Revenue mapping
                revenue: d.totalRevenue || d.revenue || 0,
                costOfRevenue: d.costOfRevenue || 0,
                grossProfit: d.grossProfit || 0,
                // Expenses mapping
                opExpenses: d.operatingExpenses || d.opExpenses || 0,
                ebitda: d.ebitda || 0,
                netIncome: d.netIncome || 0,
                // Balance Sheet mapping
                totalAssets: d.totalAssets || 0,
                totalLiabilities: d.totalLiabilities || 0,
                totalEquity: d.totalEquity || 0,
                cashAndEquivalents: d.cashAndEquivalents || 0,
                longTermDebt: d.longTermDebt || 0,
                // Cash Flow mapping
                netCashProvidedByOperatingActivities: d.netCashByOperatingActivities || d.netCashProvidedByOperatingActivities || 0,
                netCashUsedForInvestingActivities: d.netCashByInvestingActivities || d.netCashUsedForInvestingActivities || 0,
                netCashUsedProvidedByFinancingActivities: d.netCashByFinancingActivities || d.netCashUsedProvidedByFinancingActivities || 0,
                netChangeInCash: d.netChangeInCash || 0
            };
        });

        // PRICE CALCULATION
        let currentPrice = 0;
        let changePercent = 0;
        if (history.length > 0) {
            const last = history.at(-1);
            const prev = history.length > 1 ? history.at(-2) : last;
            currentPrice = last.close;
            changePercent = prev.close ? ((last.close - prev.close) / prev.close) * 100 : 0;
        }

        const responseData = {
            symbol: normalizedSymbol,
            name: meta.name || normalizedSymbol,
            price: currentPrice,
            changePercent: changePercent,
            history: history.map(h => ({ date: h.date, price: h.close })),
            fundamentals: {
                marketCap: dailyFundamentals.marketCap || meta.marketCap || 0,
                peRatio: dailyFundamentals.peRatio || 0,
                dividendYield: dailyFundamentals.dividendYield || 0,
                roe: dailyFundamentals.roe || 0,
                beta: dailyFundamentals.beta || 0,
                description: meta.description || ""
            },
            financials: {
                summary: {
                    revenue: cleanFinancials[0]?.revenue || 0,
                    netIncome: cleanFinancials[0]?.netIncome || 0
                },
                history: cleanFinancials
            },
            news: newsData.map(n => ({
                id: n.id,
                title: n.title,
                source: n.source,
                date: n.publishedDate,
                url: n.url
            }))
        };

        console.log(`--- ✅ ${normalizedSymbol} TAMAMLANDI ---\n`);
        res.json({ ok: true, data: responseData });

    } catch (error) {
        console.error(`\n❌ KRİTİK HATA:`, error.message);
        res.status(500).json({ ok: false, error: 'API hatası oluştu.' });
    }
});

export default router;
