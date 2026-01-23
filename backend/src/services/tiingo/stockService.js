// PATH: backend/src/services/tiingo/stockService.js
import tiingoClient from './tiingoClient.js';
import cache from '../cache/cacheService.js';
import logger from '../../utils/logger.js';

const PRICE_TTL = 15 * 1000;    // 15 seconds for prices
const PROFILE_TTL = 24 * 60 * 60 * 1000; // 24 hours for profiles
const SEARCH_TTL = 5 * 60 * 1000; // 5 minutes for search

/**
 * Get current stock price
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<Object>} - Price data
 */
export async function getPrice(ticker) {
    const normalizedTicker = ticker?.toUpperCase().replace('.IS', '');
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
    const normalizedTicker = ticker?.toUpperCase().replace('.IS', '');
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
    const normalizedTicker = ticker?.toUpperCase().replace('.IS', '');

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
        const tickerString = tickers.map(t => t.toUpperCase()).join(',');
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

export default {
    getPrice,
    getProfile,
    searchTicker,
    getHistoricalPrices,
    getBatchPrices
};
