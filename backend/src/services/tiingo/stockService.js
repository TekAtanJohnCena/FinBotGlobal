// PATH: backend/src/services/tiingo/stockService.js
import tiingoClient from './tiingoClient.js';
import cache from '../cache/cacheService.js';
import { formatTicker, isDelisted } from '../../utils/tickerFormatter.js';
import logger from '../../utils/logger.js';

// cacheService expects TTL in seconds (not milliseconds)
const PRICE_TTL = 15; // 15 seconds for prices
const PROFILE_TTL = 24 * 60 * 60; // 24 hours for profiles
const SEARCH_TTL = 5 * 60; // 5 minutes for search
const DAILY_FUND_TTL = 60 * 60; // 1 hour for daily fundamentals
const META_TTL = 24 * 60 * 60; // 24 hours for company meta

/**
 * Get current stock price
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<Object>} - Price data
 */
export async function getPrice(ticker) {
    const normalizedTicker = formatTicker(ticker);
    if (!normalizedTicker) {
        throw new Error('Ticker is required');
    }

    const cacheKey = `price:${normalizedTicker}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        logger.info(`📦 Cache hit: ${cacheKey}`);
        return cached;
    }

    // Real API call
    try {
        const client = tiingoClient.getClient();
        const response = await client.get(`/iex/${normalizedTicker}`);

        const data = response.data?.[0];
        if (!data) {
            throw new Error(`No price data for ${normalizedTicker}`);
        }

        const result = {
            ticker: normalizedTicker,
            price: data.last || data.tngoLast,
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.prevClose,
            volume: data.volume,
            change: (data.last || data.tngoLast) - data.prevClose,
            changePercent: ((data.last || data.tngoLast) - data.prevClose) / data.prevClose * 100,
            timestamp: data.timestamp,
            source: 'tiingo-iex'
        };

        cache.set(cacheKey, result, PRICE_TTL);
        return result;
    } catch (error) {
        logger.error(`❌ Tiingo price error for ${normalizedTicker}: ${error.message}`);
        throw error;
    }
}

/**
 * Get company profile
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<Object>} - Company profile data
 */
export async function getProfile(ticker) {
    const normalizedTicker = formatTicker(ticker);
    if (!normalizedTicker) {
        throw new Error('Ticker is required');
    }

    const cacheKey = `profile:${normalizedTicker}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        logger.info(`📦 Cache hit: ${cacheKey}`);
        return cached;
    }

    // Real API call
    try {
        const client = tiingoClient.getClient();
        const response = await client.get(`/tiingo/daily/${normalizedTicker}`);
        const data = response.data;

        const result = {
            ticker: data.ticker,
            name: data.name,
            description: data.description,
            startDate: data.startDate,
            endDate: data.endDate,
            exchangeCode: data.exchangeCode,
            isDelisted: isDelisted(data.ticker),
            source: 'tiingo'
        };

        cache.set(cacheKey, result, PROFILE_TTL);
        return result;
    } catch (error) {
        logger.error(`❌ Tiingo profile error for ${normalizedTicker}: ${error.message}`);
        throw error;
    }
}

/**
 * Search for tickers
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of matching tickers
 */
export async function searchTicker(query) {
    if (!query || query.length < 1) {
        return [];
    }

    const cacheKey = `search:${query.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        logger.info(`📦 Cache hit: ${cacheKey}`);
        return cached;
    }

    // Real API call
    try {
        const client = tiingoClient.getClient();
        const response = await client.get('/tiingo/utilities/search', {
            params: { query }
        });

        const results = response.data?.map(item => ({
            ticker: item.ticker,
            name: item.name,
            assetType: item.assetType,
            exchange: item.exchange
        })) || [];

        cache.set(cacheKey, results, SEARCH_TTL);
        return results;
    } catch (error) {
        logger.error(`❌ Tiingo search error: ${error.message}`);
        return [];
    }
}

/**
 * Get historical prices
 * @param {string} ticker - Stock ticker
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} - Array of price points
 */
export async function getHistoricalPrices(ticker, startDate, endDate) {
    const normalizedTicker = formatTicker(ticker);

    // Real API call
    try {
        const client = tiingoClient.getClient();
        const response = await client.get(`/tiingo/daily/${normalizedTicker}/prices`, {
            params: { startDate, endDate }
        });

        return response.data?.map(item => ({
            date: item.date,
            close: item.close,
            open: item.open,
            high: item.high,
            low: item.low,
            volume: item.volume
        })) || [];
    } catch (error) {
        logger.error(`❌ Tiingo historical prices error: ${error.message}`);
        throw error;
    }
}

/**
 * Get batch stock prices
 * @param {string[]} tickers - Array of stock tickers
 * @returns {Promise<Object>} - Map of ticker to price data
 */
export async function getBatchPrices(tickers) {
    if (!tickers || !tickers.length) return {};

    try {
        const tickerString = tickers.map(t => formatTicker(t)).join(',');
        const client = tiingoClient.getClient();
        const response = await client.get(`/iex/${tickerString}`);

        const results = {};
        response.data.forEach(item => {
            results[item.ticker.toUpperCase()] = {
                price: item.last || item.tngoLast || item.prevClose,
                change: (item.last || item.tngoLast) - item.prevClose,
                changePercent: item.prevClose ? (((item.last || item.tngoLast) - item.prevClose) / item.prevClose * 100) : 0
            };
        });
        return results;
    } catch (error) {
        logger.error(`❌ Tiingo batch price error: ${error.message}`);
        return {};
    }
}

/**
 * Get daily fundamental metrics (P/E, P/B, Market Cap, Enterprise Value)
 * Uses Tiingo Fundamentals Daily endpoint
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<Object|null>} - Daily fundamental data
 */
export async function getDailyFundamentals(ticker) {
    const normalizedTicker = formatTicker(ticker);
    if (!normalizedTicker) return null;

    const cacheKey = `dailyfund:${normalizedTicker}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        logger.info(`📦 Cache hit: ${cacheKey}`);
        return cached;
    }

    try {
        const client = tiingoClient.getClient();
        const response = await client.get(`/tiingo/fundamentals/${normalizedTicker}/daily`, {
            params: { sort: '-date' }
        });

        const data = Array.isArray(response.data) ? response.data[0] : response.data;
        if (!data) return null;

        const result = {
            ticker: normalizedTicker,
            date: data.date,
            marketCap: data.marketCap || null,
            enterpriseVal: data.enterpriseVal || null,
            peRatio: data.peRatio || null,
            pbRatio: data.pbRatio || null,
            trailingPEG1Y: data.trailingPEG1Y || null,
            source: 'tiingo-fundamentals-daily'
        };

        cache.set(cacheKey, result, DAILY_FUND_TTL);
        return result;
    } catch (error) {
        logger.error(`❌ Tiingo daily fundamentals error for ${normalizedTicker}: ${error.message}`);
        return null;
    }
}

/**
 * Get company meta data (sector, industry, SIC codes, website)
 * Uses Tiingo Fundamentals Meta endpoint
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<Object|null>} - Company meta data
 */
export async function getCompanyMeta(ticker) {
    const normalizedTicker = formatTicker(ticker);
    if (!normalizedTicker) return null;

    const cacheKey = `meta:${normalizedTicker}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        logger.info(`📦 Cache hit: ${cacheKey}`);
        return cached;
    }

    try {
        const client = tiingoClient.getClient();
        const response = await client.get('/tiingo/fundamentals/meta', {
            params: { tickers: normalizedTicker }
        });

        const data = Array.isArray(response.data) ? response.data[0] : response.data;
        if (!data) return null;

        const result = {
            ticker: data.ticker || normalizedTicker,
            name: data.name || null,
            isActive: data.isActive ?? true,
            isADR: data.isADR ?? false,
            sector: data.sector || null,
            industry: data.industry || null,
            sicCode: data.sicCode || null,
            sicSector: data.sicSector || null,
            sicIndustry: data.sicIndustry || null,
            reportingCurrency: data.reportingCurrency || 'USD',
            location: data.location || null,
            companyWebsite: data.companyWebsite || null,
            secFilingWebsite: data.secFilingWebsite || null,
            statementLastUpdated: data.statementLastUpdated || null,
            dailyLastUpdated: data.dailyLastUpdated || null,
            source: 'tiingo-fundamentals-meta'
        };

        cache.set(cacheKey, result, META_TTL);
        return result;
    } catch (error) {
        logger.error(`❌ Tiingo company meta error for ${normalizedTicker}: ${error.message}`);
        return null;
    }
}

export default {
    getPrice,
    getProfile,
    searchTicker,
    getHistoricalPrices,
    getBatchPrices,
    getDailyFundamentals,
    getCompanyMeta
};
