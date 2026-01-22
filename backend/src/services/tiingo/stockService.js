// PATH: backend/src/services/tiingo/stockService.js
/**
 * Stock Service - Tiingo Stock Data
 * Provides price, profile, and search functionality
 */

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

    // Mock mode
    if (tiingoClient.isMockMode()) {
        const mockData = tiingoClient.getMockStock(normalizedTicker);
        if (mockData) {
            const result = {
                ticker: mockData.ticker,
                price: mockData.price,
                open: mockData.open,
                high: mockData.high,
                low: mockData.low,
                close: mockData.close,
                volume: mockData.volume,
                change: mockData.change,
                changePercent: mockData.changePercent,
                timestamp: new Date().toISOString(),
                source: 'mock'
            };
            cache.set(cacheKey, result, PRICE_TTL);
            return result;
        }

        // Generate random price for unknown tickers
        const randomPrice = 100 + Math.random() * 400;
        const result = {
            ticker: normalizedTicker,
            price: parseFloat(randomPrice.toFixed(2)),
            open: parseFloat((randomPrice * 0.99).toFixed(2)),
            high: parseFloat((randomPrice * 1.02).toFixed(2)),
            low: parseFloat((randomPrice * 0.98).toFixed(2)),
            close: parseFloat(randomPrice.toFixed(2)),
            volume: Math.floor(Math.random() * 50000000),
            change: parseFloat((randomPrice * 0.01).toFixed(2)),
            changePercent: parseFloat((Math.random() * 2 - 1).toFixed(2)),
            timestamp: new Date().toISOString(),
            source: 'mock-generated'
        };
        cache.set(cacheKey, result, PRICE_TTL);
        return result;
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

        // Fallback to mock if API fails
        const mockData = tiingoClient.getMockStock(normalizedTicker);
        if (mockData) {
            return {
                ticker: mockData.ticker,
                price: mockData.price,
                change: mockData.change,
                changePercent: mockData.changePercent,
                timestamp: new Date().toISOString(),
                source: 'mock-fallback'
            };
        }

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

    // Mock mode
    if (tiingoClient.isMockMode()) {
        const mockData = tiingoClient.getMockStock(normalizedTicker);
        if (mockData) {
            const result = {
                ticker: mockData.ticker,
                name: mockData.name,
                description: mockData.description,
                sector: mockData.sector,
                industry: mockData.industry,
                ceo: mockData.ceo,
                employees: mockData.employees,
                marketCap: mockData.marketCap,
                peRatio: mockData.peRatio,
                dividendYield: mockData.dividendYield,
                source: 'mock'
            };
            cache.set(cacheKey, result, PROFILE_TTL);
            return result;
        }

        // Return generic profile for unknown tickers
        const result = {
            ticker: normalizedTicker,
            name: `${normalizedTicker} Inc.`,
            description: 'Company information not available.',
            sector: 'Unknown',
            industry: 'Unknown',
            source: 'mock-generated'
        };
        cache.set(cacheKey, result, PROFILE_TTL);
        return result;
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

    // Mock mode - search in mock stocks
    if (tiingoClient.isMockMode()) {
        const results = Object.values(tiingoClient.MOCK_STOCKS)
            .filter(stock =>
                stock.ticker.toLowerCase().includes(query.toLowerCase()) ||
                stock.name.toLowerCase().includes(query.toLowerCase())
            )
            .map(stock => ({
                ticker: stock.ticker,
                name: stock.name,
                sector: stock.sector
            }));

        cache.set(cacheKey, results, SEARCH_TTL);
        return results;
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

    // Mock mode - generate historical data
    if (tiingoClient.isMockMode()) {
        const mockStock = tiingoClient.getMockStock(normalizedTicker);
        const basePrice = mockStock?.price || 150;
        const days = 30;
        const prices = [];

        for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const randomFactor = 0.95 + Math.random() * 0.1;

            prices.push({
                date: date.toISOString().split('T')[0],
                close: parseFloat((basePrice * randomFactor).toFixed(2)),
                open: parseFloat((basePrice * randomFactor * 0.99).toFixed(2)),
                high: parseFloat((basePrice * randomFactor * 1.01).toFixed(2)),
                low: parseFloat((basePrice * randomFactor * 0.98).toFixed(2)),
                volume: Math.floor(Math.random() * 50000000)
            });
        }

        return prices;
    }

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

export default {
    getPrice,
    getProfile,
    searchTicker,
    getHistoricalPrices
};
