// PATH: backend/src/services/tiingo/index.js
/**
 * Tiingo Service Layer - Main Export
 * Re-exports all Tiingo services for easy importing
 */

import tiingoClient from './tiingoClient.js';
import stockService from './stockService.js';
import newsService from './newsService.js';
import fundamentalsService from './fundamentalsService.js';

// Re-export individual services
export { tiingoClient, stockService, newsService, fundamentalsService };

// Re-export commonly used functions
export const { isMockMode, getMockStock, getMockNews, getMockFundamentals } = tiingoClient;
export const { getPrice, getProfile, searchTicker, getHistoricalPrices } = stockService;
export const { getNews, getMarketHeadlines, getNewsForTickers, analyzeSentiment } = newsService;
export const { getFundamentals, getKeyMetrics, formatNumber } = fundamentalsService;

// Default export with all services
export default {
    client: tiingoClient,
    stock: stockService,
    news: newsService,
    fundamentals: fundamentalsService
};
