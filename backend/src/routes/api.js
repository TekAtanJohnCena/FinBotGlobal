import express from 'express';
import axios from 'axios';
import { getBatchPrices } from '../services/tiingo/stockService.js';
import cacheManager from '../utils/cacheManager.js';
import Stock from '../models/Stock.js';
import { INITIAL_US_STOCKS } from '../data/us/initialStocks.js'; // Import for fallback
import { getCachedFundamentals } from '../scripts/fundamentalsCacheJob.js';

import { formatTicker } from '../utils/tickerFormatter.js';
// NOTE: OpenAI removed - use /api/ai/translate endpoint instead

const router = express.Router();
const TIINGO_API_KEY = process.env.TIINGO_API_KEY;

// Cache TTL configuration (in milliseconds)
const CACHE_TTL = {
    TICKERS: 24 * 60 * 60 * 1000,      // 24 hours - Ticker metadata
    SCREENER: 15 * 60 * 1000,          // 15 minutes - Screener data
    STATEMENTS: 60 * 60 * 1000,        // 1 hour - Financial statements
    PRICES: 5 * 60 * 1000              // 5 minutes - Real-time prices
};

// NOTE: translateDescription removed - use /api/ai/translate endpoint
// Translation is now lazy-loaded via frontend

// In-memory cache variables (fallback if cacheManager not used)
let tickerMetaCache = null;
let tickerMetaTimestamp = null;
const TICKER_CACHE_DURATION = CACHE_TTL.TICKERS;

let screenerCache = {};
let screenerCacheTimestamp = null;
const SCREENER_CACHE_DURATION = CACHE_TTL.SCREENER;

let statementsCache = {};
let statementsCacheTimestamp = {};
const STATEMENTS_CACHE_DURATION = CACHE_TTL.STATEMENTS;

// Schedule periodic cleanup of expired cache files (every 6 hours)
setInterval(() => {
    console.log('🧹 Running cache cleanup...');
    cacheManager.cleanupExpired(CACHE_TTL.TICKERS);
    const stats = cacheManager.getStats();
    if (stats) {
        console.log(`📊 Cache stats: ${stats.fileCount} files, ${stats.totalSizeKB} KB`);
    }
}, 6 * 60 * 60 * 1000);

// Helper: Determine Asset Type
const getAssetType = (symbol) => {
    const s = symbol.toLowerCase();
    const cryptoTickers = ['btcusd', 'ethusd', 'solusd', 'dogeusd', 'xrpusd', 'bnbusd', 'ltcusd', 'adausd', 'matikusd'];
    const forexTickers = ['eurusd', 'gbpusd', 'usdjpy', 'usdtry', 'audusd', 'usdcad', 'xauusd'];

    if (cryptoTickers.includes(s) || (s.endsWith('usd') && s.length >= 6)) return 'CRYPTO';
    if (forexTickers.includes(s)) return 'FOREX';
    return 'STOCK';
};

// ==================== ENDPOINTS ====================

/**
 * NEW: GET /api/search
 * Proxy for Tiingo Utilities Search API
 * Query: ?query=...
 */
router.get('/search', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ ok: false, error: 'Query required.' });

    try {
        console.log(`🔍 Searching Tiingo for: ${query}`);
        const response = await axios.get(`https://api.tiingo.com/tiingo/utilities/search?query=${query}&token=${TIINGO_API_KEY}`);
        res.json({ ok: true, data: response.data });
    } catch (error) {
        console.error('❌ Search error:', error.message);
        res.status(500).json({ ok: false, error: 'Search failed.' });
    }
});

/**
 * NEW: GET /api/tiingo-tickers
 * Fetch all active US stock tickers with metadata
 */
router.get('/tiingo-tickers', async (req, res) => {
    const now = Date.now();
    if (tickerMetaCache && tickerMetaTimestamp && (now - tickerMetaTimestamp) < TICKER_CACHE_DURATION) {
        console.log('📦 Tickers: Serving from cache');
        return res.json({ ok: true, tickers: tickerMetaCache, total: tickerMetaCache.length, cached: true });
    }

    try {
        console.log('🔄 Fetching ticker metadata from Tiingo...');
        const response = await axios.get(`https://api.tiingo.com/tiingo/fundamentals/meta?token=${TIINGO_API_KEY}`);

        const allTickers = response.data || [];
        const activeTickers = allTickers
            .filter(t => t.isActive === true)
            .map(t => ({
                ticker: t.ticker,
                name: t.name || t.ticker,
                sector: t.sector || '',
                industry: t.industry || ''
            }));

        tickerMetaCache = activeTickers;
        tickerMetaTimestamp = now;

        console.log(`✅ Cached ${activeTickers.length} active US tickers`);
        res.json({ ok: true, tickers: activeTickers, total: activeTickers.length, cached: false });
    } catch (error) {
        console.error('❌ Tiingo tickers error:', error.message);
        res.status(500).json({ ok: false, error: 'Failed to fetch tickers.' });
    }
});

/**
 * A) GET /api/screener-fundamentals?page=1&limit=50&sector=...&industry=...&search=...
 * Market cap sorted screener with pagination and filters
 * OPTIMIZED: First checks pre-cached fundamentals for instant response
 */
router.get('/screener-fundamentals', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const { sector, industry, search, type } = req.query;

    // FAST PATH: Check pre-cached fundamentals first (no filters for default view)
    if (!sector && !industry && !search && !type && page === 1) {
        const cachedFundamentals = getCachedFundamentals();
        if (cachedFundamentals && cachedFundamentals.stocks) {
            console.log(`⚡ Screener: Serving from pre-cached fundamentals (${cachedFundamentals.stocks.length} stocks)`);
            const paginatedData = cachedFundamentals.stocks.slice(0, limit);
            return res.json({
                ok: true,
                data: paginatedData,
                page: 1,
                limit,
                totalStocks: cachedFundamentals.totalStocks,
                totalPages: Math.ceil(cachedFundamentals.totalStocks / limit),
                cached: true,
                cacheUpdatedAt: cachedFundamentals.updatedAt
            });
        }
    }

    // Cache key includes filters to ensure isolation
    const cacheKey = `screener_p${page}_l${limit}_s${sector || 'all'}_i${industry || 'all'}_q${search || 'none'}_t${type || 'all'}`;
    const now = Date.now();

    // Check page cache
    if (screenerCache[cacheKey] && (now - (screenerCacheTimestamp || 0)) < SCREENER_CACHE_DURATION) {
        console.log(`📦 Screener: Serving ${cacheKey} from cache`);
        // Force re-validation header
        res.set('Cache-Control', 'no-cache');
        return res.json({ ...screenerCache[cacheKey], cached: true });
    }

    try {
        // Build Query
        let query = { isActive: true };
        if (sector) query.sector = sector;
        if (industry) query.industry = industry;
        if (type) query.assetType = type;
        if (search) {
            query.$or = [
                { symbol: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } }
            ];
        }

        // 1. Fetch from Database
        const totalStocks = await Stock.countDocuments(query);
        const stocks = await Stock.find(query)
            .sort({ popularityScore: -1, symbol: 1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const pageTickers = stocks.map(s => s.symbol);
        const totalPages = Math.ceil(totalStocks / limit);

        // FALLBACK: If DB is empty, use seed data (memory)
        if (totalStocks === 0 && !search && page === 1) {
            console.log('⚠️ DB Empty - Using Fallback Seed Data');
            let fallbackData = INITIAL_US_STOCKS;

            // Apply memory filters
            if (sector) fallbackData = fallbackData.filter(s => s.sector === sector);
            if (industry) fallbackData = fallbackData.filter(s => s.industry === industry);
            if (type) fallbackData = fallbackData.filter(s => s.assetType === type);

            const fallbackTotal = fallbackData.length;
            const fallbackResults = fallbackData.slice((page - 1) * limit, page * limit);

            // We need to fetch prices for these too
            if (fallbackResults.length > 0) {
                const tickers = fallbackResults.map(s => s.symbol);
                // Reuse the batch fetch logic below by setting stocks = fallbackResults (compatible structure)
                // But wait, the logic below expects mongoose docs or objects with symbol
                // Let's just override `stocks` and `pageTickers` and proceed to batch fetch

                // However, logic below uses `stocks` array to map.
                // So we continue...

                // Update query results vars effectively
                // We can't update const, so we return early or refactor.
                // Refactoring to proceed with fallback data:

                // Let's restart the flow with fallback data
                // Or better: handle fallback in separate block and reuse fetching logic?
                // Easiest is to recursively call self or just copy fetch logic.
                // Let's copy fetch logic for robustness or restructure.

                // Re-assigning to let the below logic run
                // But `stocks` is const.
                // I will return the recursion/function call? No.
                // I will duplicate logic for now (safer than big refactor).
                // Actually, I can just continue execution if i make `stocks` let.
                // But `stocks` is awaited.

                // Let's use a flag.
            }

            // Simpler: Return simple fallback if no prices needed? 
            // Screener needs prices.

            // Let's just return logic for fallback here
            const fbSubList = fallbackData.slice((page - 1) * limit, page * limit);
            const fbTickers = fbSubList.map(s => s.symbol);

            if (fbTickers.length === 0) return res.json({ ok: true, data: [], totalStocks: 0, totalPages: 0, cached: false });

            console.log(`🔄 Screener Fallback: Fetching data for ${fbTickers.length} stocks`);

            const [pricesRes, fundResults] = await Promise.all([
                axios.get(`https://api.tiingo.com/iex/?tickers=${fbTickers.join(',')}&token=${TIINGO_API_KEY}`),
                Promise.allSettled(fbTickers.map(ticker =>
                    axios.get(`https://api.tiingo.com/tiingo/fundamentals/${ticker}/daily?token=${TIINGO_API_KEY}`)
                ))
            ]);

            const pricesData = pricesRes.data || [];

            const finalResults = fbSubList.map((stock, index) => {
                const ticker = stock.symbol;
                const p = pricesData.find(pd => pd.ticker.toLowerCase() === ticker.toLowerCase()) || {};
                const lastPrice = p.last || p.tngoLast || p.prevClose || 0;
                const changeP = p.prevClose ? ((lastPrice - p.prevClose) / p.prevClose) * 100 : 0;

                const fundRes = fundResults[index];
                const fundData = (fundRes.status === 'fulfilled' && fundRes.value.data && fundRes.value.data.length > 0)
                    ? fundRes.value.data[fundRes.value.data.length - 1] : {};

                return {
                    symbol: ticker,
                    name: stock.name,
                    sector: stock.sector,
                    industry: stock.industry,
                    lastPrice: lastPrice,
                    changePercent: changeP,
                    marketCap: fundData.marketCap || 0,
                    peRatio: fundData.peRatio || 0,
                    pbRatio: fundData.pbRatio || 0,
                    dividendYield: fundData.divYield || 0,
                    popularityScore: 0
                };
            });

            return res.json({
                ok: true,
                data: finalResults,
                page,
                limit,
                totalStocks: fallbackTotal,
                totalPages: Math.ceil(fallbackTotal / limit),
                cached: false
            });
        }

        if (pageTickers.length === 0) {
            return res.json({
                ok: true,
                data: [],
                page,
                limit,
                totalStocks,
                totalPages,
                cached: false
            });
        }

        console.log(`🔄 Screener: Fetching data for ${pageTickers.length} stocks (Filter: ${sector || 'None'})`);

        // 2. Optimized Batch Fetching
        // Fetch Daily Fundamentals (Market Cap, ratios) in parallel
        // For prices, we use IEX batch endpoint for performance
        const [pricesRes, fundResults] = await Promise.all([
            axios.get(`https://api.tiingo.com/iex/?tickers=${pageTickers.join(',')}&token=${TIINGO_API_KEY}`),
            Promise.allSettled(pageTickers.map(ticker =>
                axios.get(`https://api.tiingo.com/tiingo/fundamentals/${ticker}/daily?token=${TIINGO_API_KEY}`)
            ))
        ]);

        const pricesData = pricesRes.data || [];

        const finalResults = stocks.map((stock, index) => {
            const ticker = stock.symbol;

            // Match price data
            const p = pricesData.find(pd => pd.ticker.toLowerCase() === ticker.toLowerCase()) || {};
            const lastPrice = p.last || p.tngoLast || p.prevClose || 0;
            const changeP = p.prevClose ? ((lastPrice - p.prevClose) / p.prevClose) * 100 : 0;

            // Match fundamental data
            const fundRes = fundResults[index];
            const fundData = (fundRes.status === 'fulfilled' && fundRes.value.data && fundRes.value.data.length > 0)
                ? fundRes.value.data[fundRes.value.data.length - 1] : {};

            return {
                symbol: ticker,
                name: stock.name,
                sector: stock.sector,
                industry: stock.industry,
                lastPrice: lastPrice,
                changePercent: changeP,
                marketCap: fundData.marketCap || 0,
                peRatio: fundData.peRatio || 0,
                pbRatio: fundData.pbRatio || 0,
                dividendYield: fundData.divYield || 0,
                popularityScore: stock.popularityScore || 0
            };
        });

        const response = {
            ok: true,
            data: finalResults,
            page,
            limit,
            totalStocks,
            totalPages,
            cached: false
        };

        // Update cache
        screenerCache[cacheKey] = response;
        screenerCacheTimestamp = now;

        res.json(response);
    } catch (error) {
        console.error('❌ Screener error:', error.message);
        res.status(500).json({ ok: false, error: 'Screener calculation failed.' });
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
 * WITH ENHANCED FINANCIAL STATEMENTS CACHING
 */
router.get('/stock-analysis/:symbol', async (req, res) => {
    const { symbol } = req.params;
    const { range = '1y', lang = 'en' } = req.query; // Default range='1y', lang='en'
    const normalizedSymbol = formatTicker(symbol); // Use shared utility

    // TIINGO API FORMAT: formatTicker already does dot-to-hyphen conversion
    const apiSymbol = normalizedSymbol;

    const type = getAssetType(normalizedSymbol);
    const now = Date.now();
    // Cache key: Ensure it is unique per ticker/range/lang
    const analysisCacheKey = `analysis_${normalizedSymbol}_${range}_${lang}`;
    console.log(`🔑 Cache Key: ${analysisCacheKey} | API Symbol: ${apiSymbol}`);

    // Calculate Start Date based on Range
    let startDate = '2024-01-01'; // Default Fallback, but we will overwrite it
    const today = new Date();

    // Simple helper to subtract years/months
    const subtractTime = (years = 0, months = 0) => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - years);
        d.setMonth(d.getMonth() - months);
        return d.toISOString().split('T')[0];
    };

    switch (range) {
        case '5y':
            startDate = subtractTime(5, 0);
            break;
        case '3y':
            startDate = subtractTime(3, 0);
            break;
        case '1y':
            startDate = subtractTime(1, 0);
            break;
        case '6m':
            startDate = subtractTime(0, 6);
            break;
        case '3m':
            startDate = subtractTime(0, 3);
            break;
        case '1m':
            startDate = subtractTime(0, 1);
            break;
        case 'all':
        case 'max':
            startDate = '1980-01-01'; // Fetch all available history
            break;
        default:
            // Default to 1 year if logic fails or range not provided
            startDate = subtractTime(1, 0);
            break;
    }

    // Determine Resample Frequency
    let resampleFreq = 'daily';
    if (range === 'max' || range === 'all') {
        resampleFreq = 'weekly';
    }

    console.log(`📊 Analysis Request: ${symbol} | Requested Range: ${range} | Calculated StartDate: ${startDate} | Freq: ${resampleFreq}`);

    try {
        let responseData = {
            symbol: symbol.toUpperCase(),
            type: type,
            price: 0,
            changePercent: 0,
            history: [],
            fundamentals: { marketCap: 0, peRatio: 0, pbRatio: 0, dividendYield: 0, roe: 0, beta: 0, description: "" },
            financials: { summary: { revenue: 0, netIncome: 0 }, history: [] },
            news: []
        };

        // METADATA (Declared here to be accessible for persistence)
        let stockMetadata = {};

        if (type === 'CRYPTO') {
            const [priceRes, historyRes] = await Promise.all([
                axios.get(`https://api.tiingo.com/tiingo/crypto/prices?tickers=${apiSymbol}&token=${TIINGO_API_KEY}`),
                axios.get(`https://api.tiingo.com/tiingo/crypto/prices?tickers=${apiSymbol}&startDate=${startDate}&resampleFreq=${resampleFreq === 'weekly' ? '1day' : '1day'}&token=${TIINGO_API_KEY}`) // Crypto API uses different freq format
            ]);
            const cryptoPriceData = priceRes.data[0]?.priceData?.at(-1) || {};
            const cryptoHistoryRaw = historyRes.data[0]?.priceData || [];
            responseData.price = cryptoPriceData.last || 0;
            // Map full OHLC for Crypto
            responseData.history = cryptoHistoryRaw.map(h => ({
                date: h.date,
                open: h.open,
                high: h.high,
                low: h.low,
                close: h.close || h.price, // fallback
                price: h.close // compatibility
            }));
        } else if (type === 'FOREX') {
            const [priceRes, historyRes] = await Promise.all([
                axios.get(`https://api.tiingo.com/tiingo/fx/top?tickers=${apiSymbol}&token=${TIINGO_API_KEY}`),
                axios.get(`https://api.tiingo.com/tiingo/fx/prices?tickers=${apiSymbol}&startDate=${startDate}&resampleFreq=1day&token=${TIINGO_API_KEY}`)
            ]);
            const fxPriceData = priceRes.data[0] || {};
            const fxHistoryRaw = historyRes.data || [];
            // FX Mapping
            responseData.price = fxPriceData.lastPrice || fxPriceData.midPrice || fxPriceData.last || 0;
            responseData.history = fxHistoryRaw.map(h => ({
                date: h.date,
                open: h.open,
                high: h.high,
                low: h.low,
            }));
        } else {
            // STOCK - Check statements cache first
            // Cache keys must differ by startDate (range) to avoid serving 1-month data for a 5-year request
            // cacheKey is already defined above
            const cachedResult = cacheManager.get(analysisCacheKey, CACHE_TTL.STATEMENTS);

            if (cachedResult) {
                // DEBUG: Log cache data structure
                console.log(`📦 Serving cached analysis for ${normalizedSymbol} (${range})`);
                console.log('📊 Cache Data Type:', typeof cachedResult, '| Has .data:', !!cachedResult.data);

                // cacheManager.get returns { data, timestamp }, so access .data
                const actualData = cachedResult.data || cachedResult;
                return res.json({ ok: true, data: actualData });
            }

            // FETCH STOCK DATA (Missing Logic Restored)
            // FETCH STOCK DATA - FAST PATH (Essential data with 3s timeout)
            // NOTE: Using apiSymbol (with dashes) for Tiingo API compatibility
            // Separated into fast (prices, meta, fundDaily) and slow (statements, news) with shorter timeout
            const FAST_TIMEOUT = 3000;  // 3 seconds max for essential data
            const SLOW_TIMEOUT = 2000;  // 2 seconds for non-essential (can fail)

            const results = await Promise.allSettled([
                axios.get(`https://api.tiingo.com/tiingo/daily/${apiSymbol}/prices?startDate=${startDate}&resampleFreq=${resampleFreq}&token=${TIINGO_API_KEY}`, { timeout: FAST_TIMEOUT }),
                axios.get(`https://api.tiingo.com/tiingo/daily/${apiSymbol}?token=${TIINGO_API_KEY}`, { timeout: FAST_TIMEOUT }),
                axios.get(`https://api.tiingo.com/tiingo/fundamentals/${apiSymbol}/statements?token=${TIINGO_API_KEY}`, { timeout: SLOW_TIMEOUT }),
                axios.get(`https://api.tiingo.com/tiingo/news?tickers=${apiSymbol}&limit=5&token=${TIINGO_API_KEY}`, { timeout: SLOW_TIMEOUT }),
                axios.get(`https://api.tiingo.com/tiingo/fundamentals/${apiSymbol}/daily?token=${TIINGO_API_KEY}`, { timeout: FAST_TIMEOUT })
            ]);

            const historyRes = results[0];
            const metaRes = results[1];
            const statementsRes = results[2];
            const newsRes = results[3];
            const fundDailyRes = results[4];

            // GUARD: Ensure all responses are proper arrays/objects
            const historyRaw = (historyRes.status === 'fulfilled' && Array.isArray(historyRes.value.data))
                ? historyRes.value.data : [];

            // Assign to outer scope 'stockMetadata'
            stockMetadata = (metaRes.status === 'fulfilled' && metaRes.value.data)
                ? metaRes.value.data : {};

            const rawStatements = (statementsRes.status === 'fulfilled' && Array.isArray(statementsRes.value.data))
                ? statementsRes.value.data : [];
            const newsData = (newsRes.status === 'fulfilled' && Array.isArray(newsRes.value.data))
                ? newsRes.value.data : [];
            const fundDailyData = (fundDailyRes.status === 'fulfilled' && Array.isArray(fundDailyRes.value.data))
                ? fundDailyRes.value.data : [];

            // Get latest fundamentals/daily entry
            const latestFund = fundDailyData.length > 0 ? fundDailyData[fundDailyData.length - 1] : {};

            // Log failures for debugging
            if (historyRes.status === 'rejected') console.error(`❌ Data fetch failed (History): ${historyRes.reason.message}`);
            if (metaRes.status === 'rejected') console.error(`❌ Data fetch failed (Meta): ${metaRes.reason.message}`);
            if (statementsRes.status === 'rejected') console.error(`❌ Data fetch failed (Statements): ${statementsRes.reason.message}`);

            // Latest Daily for Fundamentals
            const latestDaily = historyRaw.length > 0 ? historyRaw[historyRaw.length - 1] : {};

            // Need to locate where responseData.history is populated for STOCK

            if (historyRaw.length > 0) {
                const last = historyRaw.at(-1);
                responseData.price = last.close || last.adjClose;
                responseData.history = historyRaw.map(h => ({
                    date: h.date,
                    // Pass everything available to let frontend handle fallbacks
                    open: h.open,
                    adjOpen: h.adjOpen,
                    high: h.high,
                    adjHigh: h.adjHigh,
                    low: h.low,
                    adjLow: h.adjLow,
                    close: h.close,
                    adjClose: h.adjClose,
                    price: h.close || h.adjClose,
                    volume: h.volume
                }));
            }


            responseData.fundamentals = {
                marketCap: latestFund.marketCap || latestDaily.marketCap || stockMetadata.marketCap || 0,
                peRatio: latestFund.peRatio || latestDaily.peRatio || 0,
                pbRatio: latestFund.pbRatio || latestDaily.pbRatio || 0,
                dividendYield: latestFund.divYield || latestFund.trailingDiv1Y || 0,
                roe: latestFund.roe || 0,
                beta: latestFund.beta || 0,
                description: stockMetadata.description || ""
            };

            // NOTE: Auto-translation removed
            // Frontend should call /api/ai/translate when user requests translation

            // Parse financial statements with correct dataCode mapping
            // GUARD: Ensure rawStatements is an array before filtering
            const safeStatements = Array.isArray(rawStatements) ? rawStatements : [];
            const annuals = safeStatements.filter(s => s && s.quarter === 0);

            responseData.financials.history = annuals.map(statement => {
                const incomeStatement = statement.statementData?.incomeStatement || [];
                const balanceSheet = statement.statementData?.balanceSheet || [];
                const cashFlow = statement.statementData?.cashFlow || [];

                const findValue = (arr, ...dataCodes) => {
                    for (const dataCode of dataCodes) {
                        const item = arr.find(i => i.dataCode === dataCode);
                        if (item && item.value != null) return item.value;
                    }
                    return 0;
                };

                return {
                    date: statement.date,
                    year: statement.year,
                    // Income Statement
                    revenue: findValue(incomeStatement, 'revenue', 'totalRevenue'),
                    costOfRevenue: findValue(incomeStatement, 'costRev', 'costOfRevenue'),
                    grossProfit: findValue(incomeStatement, 'grossProfit'),
                    opExpenses: findValue(incomeStatement, 'opex', 'operatingExpenses'),
                    ebitda: findValue(incomeStatement, 'ebitda'),
                    netIncome: findValue(incomeStatement, 'netinc', 'netIncComStock', 'consolidatedIncome'),
                    // Balance Sheet
                    cashAndEquivalents: findValue(balanceSheet, 'cashAndEq', 'cashAndEquivalents'),
                    totalAssets: findValue(balanceSheet, 'totalAssets', 'assets'),
                    totalLiabilities: findValue(balanceSheet, 'totalLiabilities', 'liabilities'),
                    longTermDebt: findValue(balanceSheet, 'debtNonCurrent', 'debt'),
                    totalEquity: findValue(balanceSheet, 'equity', 'shareholdersEquity'),
                    // Cash Flow
                    netCashProvidedByOperatingActivities: findValue(cashFlow, 'ncfo'),
                    netCashUsedForInvestingActivities: findValue(cashFlow, 'ncfi'),
                    netCashUsedProvidedByFinancingActivities: findValue(cashFlow, 'ncff'),
                    netChangeInCash: findValue(cashFlow, 'ncf')
                };
            });

            responseData.financials.summary = {
                revenue: responseData.financials.history[0]?.revenue || 0,
                netIncome: responseData.financials.history[0]?.netIncome || 0
            };

            responseData.news = newsData;
        }

        if (responseData.history.length > 1) {
            const last = responseData.history.at(-1).price;
            const prev = responseData.history.at(-2).price;
            responseData.changePercent = prev ? ((last - prev) / prev) * 100 : 0;
        }

        // CACHE VALIDATION: Only cache valid, non-empty data
        const isValidData = responseData.history &&
            responseData.history.length > 0 &&
            responseData.price > 0;

        if (isValidData) {
            cacheManager.set(analysisCacheKey, responseData);

            // PERSISTENCE: Save to DB
            // Only save if it looks like a valid US stock or explicit asset
            if (stockMetadata.ticker) {
                try {
                    await Stock.findOneAndUpdate(
                        { symbol: stockMetadata.ticker.toUpperCase() },
                        {
                            symbol: stockMetadata.ticker.toUpperCase(),
                            name: stockMetadata.name || stockMetadata.ticker,
                            exchange: stockMetadata.exchangeCode || 'NASDAQ', // Default fallback
                            sector: stockMetadata.sector || 'Unknown',
                            industry: stockMetadata.industry || 'Unknown',
                            description: stockMetadata.description,
                            isActive: true,
                            assetType: type === 'STOCK' && (stockMetadata.sector === '' || stockMetadata.description?.toLowerCase().includes('etf')) ? 'ETF' : 'Stock', // Simple heuristic, can be improved
                            // Update popularity or last accessed if we had that field
                        },
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );
                    console.log(`💾 Persisted ${stockMetadata.ticker} to Database`);
                } catch (dbErr) {
                    console.error(`⚠️ Failed to persist ${stockMetadata.ticker}:`, dbErr.message);
                }
            }
        } else {
            console.warn(`⚠️ Skipping cache for ${symbol}: Invalid data (history: ${responseData.history?.length || 0}, price: ${responseData.price})`);
        }

        res.json({ ok: true, data: responseData });
    } catch (error) {
        console.error('❌ Stock analysis error:', error.message);
        res.status(500).json({ ok: false, error: 'Failed to analyze asset.' });
    }
});

/**
 * D) GET /api/prices/batch
 */
router.get('/prices/batch', async (req, res) => {
    const { tickers } = req.query;
    if (!tickers) return res.status(400).json({ ok: false, error: 'Tickers required.' });

    try {
        const tickerArray = tickers.split(',').map(t => t.trim().toUpperCase());
        // Versioned cache key to invalidate old/bad cache without manual clearing
        const cacheKey = `batch_v2_${tickerArray.sort().join('_')}`;
        const cachedPrices = cacheManager.get(cacheKey, CACHE_TTL.PRICES);

        if (cachedPrices) {
            console.log(`📦 Serving cached batch prices`);
            return res.json({ ok: true, data: cachedPrices });
        }

        const data = await getBatchPrices(tickerArray);

        const simpleFormat = {};
        Object.keys(data).forEach(ticker => {
            const p = data[ticker].price;
            // Only include if price is valid number > 0
            if (p && typeof p === 'number' && p > 0) {
                simpleFormat[ticker] = p;
            }
        });

        // Cache ONLY if we have data
        if (Object.keys(simpleFormat).length > 0) {
            cacheManager.set(cacheKey, simpleFormat);
        }

        res.json({ ok: true, data: simpleFormat });
    } catch (error) {
        console.error('Batch price error:', error);
        res.status(500).json({ ok: false, error: 'Batch price fetch failed.' });
    }
});

/**
 * E) GET /api/validate-ticker/:symbol
 * Validate if ticker exists and return current price
 */
router.get('/validate-ticker/:symbol', async (req, res) => {
    const { symbol } = req.params;
    const normalizedSymbol = symbol.toUpperCase();

    try {
        console.log(`🔍 Validating ticker: ${normalizedSymbol}`);

        // Try to fetch price from Tiingo
        const [priceRes, fundRes] = await Promise.allSettled([
            axios.get(`https://api.tiingo.com/iex/?tickers=${normalizedSymbol}&token=${TIINGO_API_KEY}`),
            axios.get(`https://api.tiingo.com/tiingo/fundamentals/${normalizedSymbol}/daily?token=${TIINGO_API_KEY}`)
        ]);

        // Check if price data exists
        if (priceRes.status === 'fulfilled' && priceRes.value.data && priceRes.value.data.length > 0) {
            const priceData = priceRes.value.data[0];
            const lastPrice = priceData.last || priceData.tngoLast || priceData.prevClose || 0;

            let marketCap = 0;
            let name = normalizedSymbol;

            // Try to get fundamentals
            if (fundRes.status === 'fulfilled' && fundRes.value.data && fundRes.value.data.length > 0) {
                const fundArray = fundRes.value.data;
                const latestFund = fundArray[fundArray.length - 1];
                marketCap = latestFund.marketCap || 0;
            }

            console.log(`✅ Valid ticker: ${normalizedSymbol} ($${lastPrice})`);

            res.json({
                ok: true,
                valid: true,
                symbol: normalizedSymbol,
                name: name,
                price: lastPrice,
                marketCap: marketCap
            });
        } else {
            console.log(`❌ Invalid ticker: ${normalizedSymbol}`);
            res.json({
                ok: true,
                valid: false,
                symbol: normalizedSymbol,
                error: 'Ticker not found'
            });
        }
    } catch (error) {
        console.error(`❌ Ticker validation error for ${normalizedSymbol}:`, error.message);
        res.status(500).json({
            ok: false,
            valid: false,
            error: 'Validation failed. Please try again.'
        });
    }
});

export default router;
