// PATH: backend/src/scripts/fundamentalsCacheJob.js
/**
 * Background job to cache fundamentals data daily.
 * This prevents slow API calls on every screener request.
 */

import axios from 'axios';
import cacheManager from '../utils/cacheManager.js';
import Stock from '../models/Stock.js';
import { INITIAL_US_STOCKS } from '../data/us/initialStocks.js';

const TIINGO_API_KEY = process.env.TIINGO_API_KEY;
const FUNDAMENTALS_CACHE_KEY = 'fundamentals_screener';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch and cache fundamentals for all stocks in the screener.
 * Uses IEX batch API for prices + fundamentals/daily for metrics.
 */
export async function refreshFundamentalsCache() {
    console.log('🔄 Starting daily fundamentals cache refresh...');

    try {
        // Get all stock symbols from DB or fallback
        let stocks = await Stock.find({ isActive: true }).select('symbol name sector industry').lean();

        if (!stocks || stocks.length === 0) {
            console.log('⚠️ No stocks in DB, using INITIAL_US_STOCKS fallback');
            stocks = INITIAL_US_STOCKS.map(s => ({
                symbol: s.symbol,
                name: s.name,
                sector: s.sector,
                industry: s.industry
            }));
        }

        const tickers = stocks.map(s => s.symbol);
        console.log(`📊 Caching fundamentals for ${tickers.length} stocks...`);

        // Batch fetch prices via IEX (fast single request)
        let pricesData = [];
        try {
            const pricesRes = await axios.get(
                `https://api.tiingo.com/iex/?tickers=${tickers.join(',')}&token=${TIINGO_API_KEY}`,
                { timeout: 30000 }
            );
            pricesData = pricesRes.data || [];
        } catch (err) {
            console.log('⚠️ IEX price fetch failed:', err.message);
        }

        // WEEKEND/MARKET CLOSED FIX: If IEX returns little or no data, use EOD endpoint
        if (pricesData.length < tickers.length * 0.5) {
            console.log('📅 Weekend/Market closed detected - using EOD prices...');

            // Fetch EOD prices in batches (EOD gives last trading day data)
            for (let i = 0; i < Math.min(tickers.length, 30); i += 10) {
                const batch = tickers.slice(i, i + 10);
                const eodResults = await Promise.allSettled(
                    batch.map(ticker =>
                        axios.get(
                            `https://api.tiingo.com/tiingo/daily/${ticker}/prices?token=${TIINGO_API_KEY}`,
                            { timeout: 10000 }
                        )
                    )
                );

                eodResults.forEach((result, idx) => {
                    if (result.status === 'fulfilled' && result.value.data?.length > 0) {
                        const latest = result.value.data[result.value.data.length - 1];
                        pricesData.push({
                            ticker: batch[idx],
                            last: latest.close,
                            prevClose: latest.close,
                            tngoLast: latest.close
                        });
                    }
                });

                if (i + 10 < Math.min(tickers.length, 30)) {
                    await new Promise(r => setTimeout(r, 100));
                }
            }
            console.log(`📈 Fetched EOD prices for ${pricesData.length} stocks`);
        }

        console.log(`💰 Total prices available: ${pricesData.length} stocks`);

        // Build price lookup map
        const priceMap = {};
        pricesData.forEach(p => {
            if (p && p.ticker) {
                priceMap[p.ticker.toUpperCase()] = {
                    lastPrice: p.last || p.tngoLast || p.prevClose || 0,
                    prevClose: p.prevClose || 0,
                    changePercent: p.prevClose
                        ? ((p.last || p.tngoLast || p.prevClose) - p.prevClose) / p.prevClose * 100
                        : 0
                };
            }
        });

        // Fetch fundamentals in parallel batches (to avoid rate limits)
        const BATCH_SIZE = 10;
        const fundamentalsMap = {};

        for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
            const batch = tickers.slice(i, i + BATCH_SIZE);

            const results = await Promise.allSettled(
                batch.map(ticker =>
                    axios.get(
                        `https://api.tiingo.com/tiingo/fundamentals/${ticker}/daily?token=${TIINGO_API_KEY}`,
                        { timeout: 10000 }
                    )
                )
            );

            results.forEach((result, idx) => {
                const ticker = batch[idx];
                if (result.status === 'fulfilled' && result.value.data?.length > 0) {
                    const latest = result.value.data[result.value.data.length - 1];
                    fundamentalsMap[ticker] = {
                        marketCap: latest.marketCap || 0,
                        peRatio: latest.peRatio || 0,
                        pbRatio: latest.pbRatio || 0,
                        dividendYield: latest.divYield || 0
                    };
                } else {
                    fundamentalsMap[ticker] = { marketCap: 0, peRatio: 0, pbRatio: 0, dividendYield: 0 };
                }
            });

            // Small delay between batches to avoid rate limiting
            if (i + BATCH_SIZE < tickers.length) {
                await new Promise(r => setTimeout(r, 200));
            }
        }

        console.log(`📈 Fetched fundamentals for ${Object.keys(fundamentalsMap).length} stocks`);

        // Combine into final cache data
        const cachedData = stocks.map(stock => {
            const symbol = stock.symbol;
            const price = priceMap[symbol] || { lastPrice: 0, changePercent: 0 };
            const fund = fundamentalsMap[symbol] || { marketCap: 0, peRatio: 0, pbRatio: 0, dividendYield: 0 };

            return {
                symbol: symbol,
                name: stock.name,
                sector: stock.sector || 'Unknown',
                industry: stock.industry || 'Unknown',
                lastPrice: price.lastPrice,
                changePercent: price.changePercent,
                marketCap: fund.marketCap,
                peRatio: fund.peRatio,
                pbRatio: fund.pbRatio,
                dividendYield: fund.dividendYield,
                popularityScore: stock.popularityScore || 50
            };
        });

        // Sort by market cap descending
        cachedData.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));

        // Save to cache
        cacheManager.set(FUNDAMENTALS_CACHE_KEY, {
            stocks: cachedData,
            totalStocks: cachedData.length,
            updatedAt: new Date().toISOString()
        });

        console.log(`✅ Fundamentals cache refreshed: ${cachedData.length} stocks cached`);
        return cachedData;

    } catch (error) {
        console.error('❌ Fundamentals cache refresh error:', error.message);
        return null;
    }
}

/**
 * Start the daily cache job scheduler.
 * Runs immediately on startup, then every 6 hours.
 */
export function startFundamentalsCacheJob() {
    // Run immediately on startup (after short delay for DB)
    setTimeout(() => {
        console.log('🚀 Running initial fundamentals cache...');
        refreshFundamentalsCache();
    }, 5000);

    // Pre-cache top stocks 10 seconds after startup
    setTimeout(() => {
        console.log('⚡ Pre-caching top stocks for instant access...');
        preCacheTopStocks();
    }, 10000);

    // Schedule to run every 6 hours
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    setInterval(() => {
        console.log('⏰ Scheduled fundamentals cache refresh');
        refreshFundamentalsCache();
    }, SIX_HOURS);

    console.log('📅 Fundamentals cache job scheduled (every 6 hours)');
}

/**
 * Pre-cache top 10 stocks by making API calls on startup
 * This warms up the cache so popular stocks load instantly
 */
async function preCacheTopStocks() {
    const TOP_STOCKS = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'JPM', 'V', 'WMT'];

    for (const ticker of TOP_STOCKS) {
        try {
            // Make internal request to cache this stock
            const startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 5);
            const startDateStr = startDate.toISOString().split('T')[0];

            const [historyRes, metaRes, fundRes] = await Promise.allSettled([
                axios.get(`https://api.tiingo.com/tiingo/daily/${ticker}/prices?startDate=${startDateStr}&resampleFreq=daily&token=${TIINGO_API_KEY}`, { timeout: 5000 }),
                axios.get(`https://api.tiingo.com/tiingo/daily/${ticker}?token=${TIINGO_API_KEY}`, { timeout: 3000 }),
                axios.get(`https://api.tiingo.com/tiingo/fundamentals/${ticker}/daily?token=${TIINGO_API_KEY}`, { timeout: 3000 })
            ]);

            if (historyRes.status === 'fulfilled') {
                const history = historyRes.value.data || [];
                const meta = metaRes.status === 'fulfilled' ? metaRes.value.data : {};
                const fund = fundRes.status === 'fulfilled' && fundRes.value.data?.length > 0
                    ? fundRes.value.data[fundRes.value.data.length - 1] : {};

                const cacheKey = `analysis_${ticker}_5y_en`;
                cacheManager.set(cacheKey, {
                    symbol: ticker,
                    name: meta.name || ticker,
                    price: history.length > 0 ? history[history.length - 1].close : 0,
                    history: history.map(h => ({
                        date: h.date,
                        open: h.open,
                        high: h.high,
                        low: h.low,
                        close: h.close,
                        adjClose: h.adjClose,
                        price: h.close,
                        volume: h.volume
                    })),
                    fundamentals: {
                        marketCap: fund.marketCap || 0,
                        peRatio: fund.peRatio || 0,
                        description: meta.description || ''
                    },
                    financials: { summary: {}, history: [] },
                    news: []
                });
                console.log(`✅ Pre-cached: ${ticker}`);
            }

            // Small delay between stocks
            await new Promise(r => setTimeout(r, 200));
        } catch (err) {
            console.log(`⚠️ Pre-cache failed for ${ticker}:`, err.message);
        }
    }

    console.log('🎯 Top stocks pre-cache complete!');
}

/**
 * Get cached fundamentals data
 */
export function getCachedFundamentals() {
    const cached = cacheManager.get(FUNDAMENTALS_CACHE_KEY, CACHE_TTL);
    return cached?.data || null;
}

export default {
    refreshFundamentalsCache,
    startFundamentalsCacheJob,
    getCachedFundamentals
};
