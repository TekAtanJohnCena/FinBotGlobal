// PATH: frontend/src/services/stockApi.js
/**
 * Stock API Service - Tiingo Endpoints
 * Provides stock price, news, and analysis data
 */

import api from "../lib/api";

// ============== STOCK PRICES ==============

/**
 * Get current price for a stock
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<Object>} - Price data
 */
export async function getStockPrice(ticker) {
    const normalizedTicker = ticker?.toUpperCase().replace('.IS', '');
    const res = await api.get(`/price/${normalizedTicker}`);
    return res.data;
}

/**
 * Get prices for multiple stocks
 * @param {Array<string>} tickers - Array of ticker symbols
 * @returns {Promise<Object>} - Object with ticker keys
 */
export async function getBulkPrices(tickers) {
    const tickerList = tickers.map(t => t.toUpperCase().replace('.IS', '')).join(',');
    const res = await api.get(`/price/bulk/list?tickers=${tickerList}`);
    return res.data;
}

/**
 * Search for stocks
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of matching stocks
 */
export async function searchStocks(query) {
    const res = await api.get(`/price/search/${query}`);
    return res.data?.results || [];
}

// ============== STOCK QUOTE ==============

/**
 * Get detailed quote for a stock
 * @param {string} ticker - Stock ticker
 * @returns {Promise<Object>} - Quote data with price and fundamentals
 */
export async function getStockQuote(ticker) {
    const normalizedTicker = ticker?.toUpperCase().replace('.IS', '');
    const res = await api.get(`/finance/quote?symbol=${normalizedTicker}`);
    return res.data;
}

/**
 * Get quotes for multiple stocks
 * @param {Array<string>} tickers - Array of tickers
 * @returns {Promise<Object>} - Quote data
 */
export async function getBulkQuotes(tickers) {
    const tickerList = tickers.map(t => t.toUpperCase().replace('.IS', '')).join(',');
    const res = await api.get(`/finance/quotes?symbols=${tickerList}`);
    return res.data;
}

// ============== COMPANY PROFILE ==============

/**
 * Get company profile
 * @param {string} ticker - Stock ticker
 * @returns {Promise<Object>} - Company info
 */
export async function getCompanyProfile(ticker) {
    const res = await api.get(`/finance/profile/${ticker}`);
    return res.data;
}

/**
 * Get company financials
 * @param {string} ticker - Stock ticker
 * @returns {Promise<Object>} - Financial data
 */
export async function getCompanyFinancials(ticker) {
    const res = await api.get(`/finance/financials/${ticker}`);
    return res.data;
}

// ============== ANALYSIS ==============

/**
 * Get AI analysis for a stock
 * @param {string} ticker - Stock ticker
 * @returns {Promise<Object>} - Analysis with score and metrics
 */
export async function getStockAnalysis(ticker) {
    const res = await api.post('/analysis/stock', { ticker });
    return res.data;
}

/**
 * Get quick analysis
 * @param {string} ticker - Stock ticker
 * @returns {Promise<Object>} - Quick analysis data
 */
export async function getQuickAnalysis(ticker) {
    const res = await api.get(`/analysis/${ticker}`);
    return res.data;
}

// ============== CHART DATA ==============

/**
 * Get historical chart data
 * @param {string} ticker - Stock ticker
 * @param {string} range - Time range (1d, 5d, 1mo, 3mo, 6mo, 1y, 5y)
 * @returns {Promise<Object>} - Candle data for charts
 */
export async function getChartData(ticker, range = '6mo') {
    const normalizedTicker = ticker?.toUpperCase().replace('.IS', '');
    const res = await api.get(`/finance/chart?symbol=${normalizedTicker}&range=${range}`);
    return res.data;
}

// ============== NEWS ==============

/**
 * Get market news
 * @param {string} ticker - Optional ticker filter
 * @param {number} limit - Max articles
 * @returns {Promise<Array>} - News articles
 */
export async function getMarketNews(ticker = null, limit = 20) {
    // Note: News endpoint will be added in future when Kap.jsx is connected
    // For now, return empty array
    return [];
}

// ============== HELPERS ==============

/**
 * Format price for display
 * @param {number} price - Price value
 * @returns {string} - Formatted price
 */
export function formatPrice(price) {
    if (price === null || price === undefined) return '—';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
}

/**
 * Format large numbers (B/M/K)
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

/**
 * Format percentage change
 * @param {number} change - Change percentage
 * @returns {string} - Formatted with + or -
 */
export function formatChange(change) {
    if (change === null || change === undefined) return '—';
    const prefix = change >= 0 ? '+' : '';
    return `${prefix}${change.toFixed(2)}%`;
}

export default {
    getStockPrice,
    getBulkPrices,
    searchStocks,
    getStockQuote,
    getBulkQuotes,
    getCompanyProfile,
    getCompanyFinancials,
    getStockAnalysis,
    getQuickAnalysis,
    getChartData,
    getMarketNews,
    formatPrice,
    formatNumber,
    formatChange
};
