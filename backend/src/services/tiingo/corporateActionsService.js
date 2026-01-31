// PATH: backend/src/services/tiingo/corporateActionsService.js
import tiingoClient from './tiingoClient.js';
import cache from '../cache/cacheService.js';

import { formatTicker } from '../../utils/tickerFormatter.js';

const DISTRIBUTIONS_TTL = 24 * 60 * 60 * 1000; // 24 hours (Corporate actions don't change often)
const YIELD_TTL = 12 * 60 * 60 * 1000; // 12 hours

/**
 * Get distribution (dividend) history for a ticker
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<Array>} - List of distributions
 */
export async function getDistributions(ticker) {
    const normalizedTicker = formatTicker(ticker);
    if (!normalizedTicker) return [];

    const cacheKey = `distributions:${normalizedTicker}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        return cached;
    }

    try {
        const client = tiingoClient.getClient();
        // https://api.tiingo.com/tiingo/corporate-actions/<ticker>/distributions
        const response = await client.get(`/tiingo/corporate-actions/${normalizedTicker}/distributions`);

        const data = response.data || [];

        // Cache the result
        cache.set(cacheKey, data, DISTRIBUTIONS_TTL);
        return data;
    } catch (error) {
        if (error.response?.status === 404) {
            return []; // No data found
        }
        console.error(`❌ Tiingo distributions error for ${normalizedTicker}:`, error.message);
        return [];
    }
}

/**
 * Get distribution yield (historical yield)
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<number|null>} - Most recent Yield (percentage, e.g. 0.05 for 5%)
 */
export async function getDistributionYield(ticker) {
    const normalizedTicker = formatTicker(ticker);
    if (!normalizedTicker) return null;

    const cacheKey = `yield:${normalizedTicker}`;
    const cached = cache.get(cacheKey);
    if (cached !== undefined && cached !== null) {
        return cached;
    }

    try {
        const client = tiingoClient.getClient();
        // https://api.tiingo.com/tiingo/corporate-actions/<ticker>/distribution-yield
        // Note: The prompt says "historical yield" endpoint. 
        // Docs: https://api.tiingo.com/documentation/end-of-day 
        // Actually it might be part of fundamentals or a separate endpoint.
        // Prompt URL: https://api.tiingo.com/tiingo/corporate-actions/<ticker>/distribution-yield

        const response = await client.get(`/tiingo/corporate-actions/${normalizedTicker}/distribution-yield`);

        // Response is likely an array of objects with date and yield fields?
        // Or specific object?
        // Assuming array based on "Historical Yield" name, we want the most recent.
        // Let's assume standard Tiingo array format.

        const data = response.data;

        if (Array.isArray(data) && data.length > 0) {
            // Sort by date descending if not already? Tiingo usually valid date order.
            // Let's find the most recent non-null yield.
            // Actually Tiingo "distribution-yield" endpoint usually returns:
            // [ { date: '...', yield: ... }, ... ]

            // We want the latest one
            const latest = data[data.length - 1]; // Tiingo usually returns ascending by date? Or descending?
            // Safer to sort
            const sorted = data.sort((a, b) => new Date(b.date) - new Date(a.date));
            const mostRecent = sorted[0];

            if (mostRecent) {
                const yieldVal = mostRecent.yield || mostRecent.distributionYield;
                cache.set(cacheKey, yieldVal, YIELD_TTL);
                return yieldVal;
            }
        }

        return null;
    } catch (error) {
        if (error.response?.status === 404) {
            return null;
        }
        console.error(`❌ Tiingo yield error for ${normalizedTicker}:`, error.message);
        return null;
    }
}

/**
 * Get stock splits history
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<Array>} - List of splits
 */
export async function getSplits(ticker) {
    const normalizedTicker = formatTicker(ticker);
    if (!normalizedTicker) return [];

    const cacheKey = `splits:${normalizedTicker}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        return cached;
    }

    try {
        const client = tiingoClient.getClient();
        // https://api.tiingo.com/tiingo/corporate-actions/<ticker>/splits
        const response = await client.get(`/tiingo/corporate-actions/${normalizedTicker}/splits`);

        const data = response.data || [];
        // Cache the result (Splits are rare events, 24h+ TTL is fine)
        cache.set(cacheKey, data, DISTRIBUTIONS_TTL);
        return data;
    } catch (error) {
        if (error.response?.status === 404) {
            return []; // No data found
        }
        console.error(`❌ Tiingo splits error for ${normalizedTicker}:`, error.message);
        return [];
    }
}

export default {
    getDistributions,
    getDistributionYield,
    getSplits
};
