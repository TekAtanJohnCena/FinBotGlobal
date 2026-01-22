// PATH: backend/src/services/tiingo/fundamentalsService.js
/**
 * Fundamentals Service - Tiingo Financial Statements
 * Provides 10-K, 10-Q, Income Statement, Balance Sheet data
 */

import tiingoClient from './tiingoClient.js';
import cache from '../cache/cacheService.js';

const FUNDAMENTALS_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get fundamental financial data
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<Object>} - Financial fundamentals
 */
export async function getFundamentals(ticker) {
    const normalizedTicker = ticker?.toUpperCase().replace('.IS', '');
    if (!normalizedTicker) {
        throw new Error('Ticker is required');
    }

    const cacheKey = `fundamentals:${normalizedTicker}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        console.log(`📦 Cache hit: ${cacheKey}`);
        return cached;
    }

    // Mock mode
    if (tiingoClient.isMockMode()) {
        const mockData = tiingoClient.getMockFundamentals(normalizedTicker);
        if (mockData) {
            cache.set(cacheKey, mockData, FUNDAMENTALS_TTL);
            return mockData;
        }

        // Generate basic fundamentals for unknown tickers
        const result = {
            ticker: normalizedTicker,
            period: 'Q4 2024',
            reportType: '10-Q',
            revenue: Math.floor(Math.random() * 50000000000),
            netIncome: Math.floor(Math.random() * 10000000000),
            grossProfit: Math.floor(Math.random() * 20000000000),
            operatingIncome: Math.floor(Math.random() * 15000000000),
            totalAssets: Math.floor(Math.random() * 100000000000),
            totalLiabilities: Math.floor(Math.random() * 50000000000),
            shareholderEquity: Math.floor(Math.random() * 50000000000),
            operatingCashFlow: Math.floor(Math.random() * 15000000000),
            eps: parseFloat((Math.random() * 5).toFixed(2)),
            roe: parseFloat((Math.random() * 30).toFixed(1)),
            roa: parseFloat((Math.random() * 15).toFixed(1)),
            debtToEquity: parseFloat((Math.random() * 2).toFixed(2)),
            source: 'mock-generated'
        };
        cache.set(cacheKey, result, FUNDAMENTALS_TTL);
        return result;
    }

    // Real API call (requires premium Tiingo access)
    try {
        const client = tiingoClient.getClient();
        const response = await client.get(`/tiingo/fundamentals/${normalizedTicker}/statements`, {
            params: { asReported: false }
        });

        const statements = response.data;
        if (!statements || statements.length === 0) {
            throw new Error(`No fundamental data for ${normalizedTicker}`);
        }

        const latest = statements[0];
        const result = {
            ticker: normalizedTicker,
            period: `${latest.year} ${latest.quarter}`,
            reportType: latest.quarter === 'Y' ? '10-K' : '10-Q',
            revenue: latest.revenue,
            netIncome: latest.netIncome,
            grossProfit: latest.grossProfit,
            operatingIncome: latest.operatingIncome,
            totalAssets: latest.totalAssets,
            totalLiabilities: latest.totalLiabilities,
            shareholderEquity: latest.totalEquity,
            operatingCashFlow: latest.cashFromOperatingActivities,
            eps: latest.eps,
            source: 'tiingo'
        };

        // Calculate ratios
        if (result.netIncome && result.shareholderEquity > 0) {
            result.roe = (result.netIncome / result.shareholderEquity) * 100;
        }
        if (result.netIncome && result.totalAssets > 0) {
            result.roa = (result.netIncome / result.totalAssets) * 100;
        }
        if (result.totalLiabilities && result.shareholderEquity > 0) {
            result.debtToEquity = result.totalLiabilities / result.shareholderEquity;
        }

        cache.set(cacheKey, result, FUNDAMENTALS_TTL);
        return result;
    } catch (error) {
        console.error(`❌ Tiingo fundamentals error for ${normalizedTicker}:`, error.message);

        // Fallback to mock
        const mockData = tiingoClient.getMockFundamentals(normalizedTicker);
        if (mockData) {
            return { ...mockData, source: 'mock-fallback' };
        }

        throw error;
    }
}

/**
 * Get key financial metrics
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<Object>} - Key metrics
 */
export async function getKeyMetrics(ticker) {
    const fundamentals = await getFundamentals(ticker);

    return {
        ticker: fundamentals.ticker,
        period: fundamentals.period,
        eps: fundamentals.eps,
        roe: fundamentals.roe,
        roa: fundamentals.roa,
        debtToEquity: fundamentals.debtToEquity,
        profitMargin: fundamentals.netIncome && fundamentals.revenue
            ? ((fundamentals.netIncome / fundamentals.revenue) * 100).toFixed(1)
            : null
    };
}

/**
 * Format number for display (B/M/K)
 * @param {number} num - Number to format
 * @returns {string} - Formatted string
 */
export function formatNumber(num) {
    if (num === null || num === undefined || !isFinite(num)) return '—';
    if (Math.abs(num) >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
    if (Math.abs(num) >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (Math.abs(num) >= 1_000) return (num / 1_000).toFixed(2) + 'K';
    return Number(num).toFixed(2);
}

export default {
    getFundamentals,
    getKeyMetrics,
    formatNumber
};
