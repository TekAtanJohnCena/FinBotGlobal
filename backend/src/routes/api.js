import express from 'express';
import axios from 'axios';
import { getBatchPrices } from '../services/tiingo/stockService.js';
import cacheManager from '../utils/cacheManager.js';
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
 * A) GET /api/screener-fundamentals?page=1&limit=50
 * Market cap sorted screener with pagination
 */
router.get('/screener-fundamentals', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const cacheKey = `page_${page}_limit_${limit}`;
    const now = Date.now();

    // Check page cache
    if (screenerCache[cacheKey] && screenerCacheTimestamp && (now - screenerCacheTimestamp) < SCREENER_CACHE_DURATION) {
        console.log(`📦 Screener page ${page}: From cache`);
        return res.json({ ...screenerCache[cacheKey], cached: true });
    }

    try {
        // Hardcoded top 200 stocks by market cap (popular stocks)
        const topStocks = [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'LLY', 'V',
            'UNH', 'XOM', 'JNJ', 'WMT', 'JPM', 'MA', 'PG', 'AVGO', 'HD', 'CVX',
            'MRK', 'COST', 'ABBV', 'KO', 'PEP', 'ADBE', 'CRM', 'NFLX', 'BAC', 'TMO',
            'ORCL', 'CSCO', 'MCD', 'ACN', 'LIN', 'AMD', 'NKE', 'QCOM', 'TXN', 'DIS',
            'ABT', 'CMCSA', 'WFC', 'PM', 'INTC', 'VZ', 'AMGN', 'DHR', 'NEE', 'UNP',
            'IBM', 'INTU', 'HON', 'COP', 'RTX', 'GE', 'NOW', 'UPS', 'LOW', 'CAT',
            'ELV', 'SPGI', 'PFE', 'AMAT', 'GS', 'MS', 'T', 'BKNG', 'SBUX', 'AXP',
            'DE', 'BLK', 'GILD', 'TJX', 'MDT', 'SYK', 'ISRG', 'VRTX', 'LMT', 'PLD',
            'BA', 'REGN', 'ADI', 'C', 'ETN', 'CVS', 'CB', 'CI', 'MDLZ', 'AMT',
            'BSX', 'SCHW', 'TMUS', 'MO', 'LRCX', 'FI', 'ZTS', 'PGR', 'MMC', 'DUK',
            'SO', 'EOG', 'BDX', 'PYPL', 'TT', 'ITW', 'BMY', 'EQIX', 'NOC', 'AON',
            'SLB', 'PANW', 'MU', 'APH', 'SHW', 'CL', 'TDG', 'WM', 'MCO', 'CME',
            'SNPS', 'HCA', 'ICE', 'USB', 'GD', 'PSA', 'APD', 'MSI', 'KLAC', 'CDNS',
            'NSC', 'PH', 'ORLY', 'WELL', 'MCK', 'MAR', 'PNC', 'CCI', 'ECL', 'HUM',
            'TGT', 'GM', 'F', 'MRNA', 'BIIB', 'ADP', 'CHTR', 'EMR', 'ADSK', 'ROP',
            'SRE', 'OXY', 'AJG', 'TRV', 'CARR', 'AFL', 'NXPI', 'KMB', 'NEM', 'GIS',
            'CMG', 'AIG', 'MCHP', 'ABNB', 'AZO', 'FDX', 'DLR', 'COF', 'FCX', 'PSX',
            'PAYX', 'MPC', 'O', 'FTNT', 'SPG', 'TEL', 'MNST', 'SYY', 'KDP', 'AEP',
            'HES', 'ROST', 'D', 'VLO', 'CPRT', 'CTSH', 'KMI', 'DHI', 'IQV', 'ODFL'
        ];

        const totalStocks = topStocks.length;
        const totalPages = Math.ceil(totalStocks / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const pageTickers = topStocks.slice(startIndex, endIndex);

        console.log(`🔄 Screener page ${page}/${totalPages}: Fetching ${pageTickers.length} stocks`);

        const results = await Promise.all(pageTickers.map(async (ticker) => {
            try {
                const [priceRes, fundRes] = await Promise.all([
                    axios.get(`https://api.tiingo.com/iex/?tickers=${ticker}&token=${TIINGO_API_KEY}`),
                    axios.get(`https://api.tiingo.com/tiingo/fundamentals/${ticker}/daily?token=${TIINGO_API_KEY}`)
                ]);

                const p = priceRes.data[0] || {};
                const fArray = fundRes.data || [];
                const f = fArray[fArray.length - 1] || {};

                const lastPrice = p.last || p.tngoLast || p.prevClose || 0;
                const changeP = p.prevClose ? ((lastPrice - p.prevClose) / p.prevClose) * 100 : 0;

                return {
                    symbol: ticker,
                    name: ticker,
                    lastPrice: lastPrice,
                    changePercent: changeP,
                    marketCap: f.marketCap || 0,
                    peRatio: f.peRatio || 0,
                    pbRatio: f.pbRatio || 0,
                    dividendYield: 0,
                    beta: 0,
                    roe: 0
                };
            } catch (err) {
                console.error(`❌ Error ${ticker}:`, err.message);
                return null;
            }
        }));

        const validResults = results.filter(r => r !== null);

        const response = {
            ok: true,
            data: validResults,
            page: page,
            limit: limit,
            totalStocks: totalStocks,
            totalPages: totalPages,
            cached: false
        };

        screenerCache[cacheKey] = response;
        screenerCacheTimestamp = now;

        console.log(`✅ Screener page ${page}: Cached ${validResults.length} stocks`);
        res.json(response);
    } catch (error) {
        console.error('❌ Screener error:', error.message);
        res.status(500).json({ ok: false, error: 'Screener failed.' });
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
    const normalizedSymbol = symbol.toLowerCase();

    // TIINGO API FORMAT: Convert dots to dashes (BRK.B -> BRK-B)
    const apiSymbol = normalizedSymbol.replace(/\./g, '-');

    const type = getAssetType(normalizedSymbol);
    const now = Date.now();
    // Include lang in cache key so translations are cached separately
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
            // FETCH STOCK DATA (Refactored to Promise.allSettled for robustness)
            // NOTE: Using apiSymbol (with dashes) for Tiingo API compatibility
            const results = await Promise.allSettled([
                axios.get(`https://api.tiingo.com/tiingo/daily/${apiSymbol}/prices?startDate=${startDate}&resampleFreq=${resampleFreq}&token=${TIINGO_API_KEY}`),
                axios.get(`https://api.tiingo.com/tiingo/daily/${apiSymbol}?token=${TIINGO_API_KEY}`),
                axios.get(`https://api.tiingo.com/tiingo/fundamentals/${apiSymbol}/statements?token=${TIINGO_API_KEY}`),
                axios.get(`https://api.tiingo.com/tiingo/news?tickers=${apiSymbol}&token=${TIINGO_API_KEY}`),
                axios.get(`https://api.tiingo.com/tiingo/fundamentals/${apiSymbol}/daily?token=${TIINGO_API_KEY}`)
            ]);

            const historyRes = results[0];
            const metaRes = results[1];
            const statementsRes = results[2];
            const newsRes = results[3];
            const fundDailyRes = results[4];

            // GUARD: Ensure all responses are proper arrays/objects
            const historyRaw = (historyRes.status === 'fulfilled' && Array.isArray(historyRes.value.data))
                ? historyRes.value.data : [];
            const meta = (metaRes.status === 'fulfilled' && metaRes.value.data)
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
                marketCap: latestFund.marketCap || latestDaily.marketCap || meta.marketCap || 0,
                peRatio: latestFund.peRatio || latestDaily.peRatio || 0,
                pbRatio: latestFund.pbRatio || latestDaily.pbRatio || 0,
                dividendYield: latestFund.divYield || latestFund.trailingDiv1Y || 0,
                roe: latestFund.roe || 0,
                beta: latestFund.beta || 0,
                description: meta.description || ""
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
