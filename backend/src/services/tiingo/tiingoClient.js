// PATH: backend/src/services/tiingo/tiingoClient.js
/**
 * Tiingo API Client
 * Centralized Axios instance with authentication and mock data fallback
 */

import axios from 'axios';
import cache from '../cache/cacheService.js';

const TIINGO_API_KEY = process.env.TIINGO_API_KEY;
const USE_MOCK = !TIINGO_API_KEY || process.env.TIINGO_MOCK_MODE === 'true';

// Log initialization
if (USE_MOCK) {
    console.log('🔄 Tiingo service initialized in MOCK MODE');
} else {
    console.log('✅ Tiingo service initialized with API key');
}

// Axios instance for Tiingo API
const tiingoAxios = axios.create({
    baseURL: 'https://api.tiingo.com',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        ...(TIINGO_API_KEY && { 'Authorization': `Token ${TIINGO_API_KEY}` })
    }
});

// Request interceptor for logging
tiingoAxios.interceptors.request.use(config => {
    console.log(`📡 Tiingo API: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
});

// Response interceptor for error handling
tiingoAxios.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 429) {
            console.error('⚠️ Tiingo rate limit exceeded');
        } else if (error.response?.status === 401) {
            console.error('❌ Tiingo API key invalid');
        }
        throw error;
    }
);

// ============== MOCK DATA ==============

export const MOCK_STOCKS = {
    AAPL: {
        ticker: 'AAPL',
        name: 'Apple Inc.',
        description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
        sector: 'Technology',
        industry: 'Consumer Electronics',
        ceo: 'Tim Cook',
        employees: 164000,
        marketCap: 3100000000000,
        price: 185.92,
        open: 185.21,
        high: 186.50,
        low: 184.89,
        close: 185.92,
        volume: 45123456,
        change: 0.71,
        changePercent: 0.38,
        peRatio: 28.5,
        dividend: 0.96,
        dividendYield: 0.52
    },
    TSLA: {
        ticker: 'TSLA',
        name: 'Tesla, Inc.',
        description: 'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems.',
        sector: 'Consumer Cyclical',
        industry: 'Auto Manufacturers',
        ceo: 'Elon Musk',
        employees: 127855,
        marketCap: 780000000000,
        price: 248.50,
        open: 245.00,
        high: 252.30,
        low: 243.80,
        close: 248.50,
        volume: 98765432,
        change: 3.50,
        changePercent: 1.43,
        peRatio: 65.2,
        dividend: 0,
        dividendYield: 0
    },
    NVDA: {
        ticker: 'NVDA',
        name: 'NVIDIA Corporation',
        description: 'NVIDIA Corporation provides graphics, and compute and networking solutions in the United States, Taiwan, China, and internationally.',
        sector: 'Technology',
        industry: 'Semiconductors',
        ceo: 'Jensen Huang',
        employees: 29600,
        marketCap: 1200000000000,
        price: 495.22,
        open: 490.00,
        high: 498.50,
        low: 488.00,
        close: 495.22,
        volume: 52341678,
        change: 5.22,
        changePercent: 1.06,
        peRatio: 55.8,
        dividend: 0.16,
        dividendYield: 0.03
    },
    MSFT: {
        ticker: 'MSFT',
        name: 'Microsoft Corporation',
        description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.',
        sector: 'Technology',
        industry: 'Software - Infrastructure',
        ceo: 'Satya Nadella',
        employees: 221000,
        marketCap: 2800000000000,
        price: 378.91,
        open: 375.50,
        high: 380.25,
        low: 374.00,
        close: 378.91,
        volume: 21456789,
        change: 3.41,
        changePercent: 0.91,
        peRatio: 32.1,
        dividend: 2.72,
        dividendYield: 0.72
    },
    GOOGL: {
        ticker: 'GOOGL',
        name: 'Alphabet Inc.',
        description: 'Alphabet Inc. offers various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.',
        sector: 'Communication Services',
        industry: 'Internet Content & Information',
        ceo: 'Sundar Pichai',
        employees: 182502,
        marketCap: 1750000000000,
        price: 141.80,
        open: 140.50,
        high: 142.90,
        low: 139.80,
        close: 141.80,
        volume: 18976543,
        change: 1.30,
        changePercent: 0.92,
        peRatio: 24.3,
        dividend: 0,
        dividendYield: 0
    }
};

export const MOCK_NEWS = [
    {
        id: 1,
        title: 'Apple Reports Record Q4 Revenue Driven by iPhone Sales',
        description: 'Apple Inc. announced record fourth-quarter revenue of $89.5 billion, driven by strong iPhone 15 sales and growing services revenue.',
        source: 'Reuters',
        url: 'https://example.com/apple-q4-2024',
        publishedDate: new Date().toISOString(),
        tickers: ['AAPL'],
        tags: ['earnings', 'technology'],
        sentiment: 'positive'
    },
    {
        id: 2,
        title: 'Tesla Expands Supercharger Network Across Europe',
        description: 'Tesla announced plans to add 5,000 new Supercharger stations across Europe by 2025, accelerating EV infrastructure development.',
        source: 'Bloomberg',
        url: 'https://example.com/tesla-supercharger',
        publishedDate: new Date(Date.now() - 3600000).toISOString(),
        tickers: ['TSLA'],
        tags: ['infrastructure', 'ev'],
        sentiment: 'positive'
    },
    {
        id: 3,
        title: 'NVIDIA AI Chips See Unprecedented Demand from Cloud Providers',
        description: 'NVIDIA reports H100 GPU demand exceeding supply as major cloud providers race to build AI infrastructure.',
        source: 'CNBC',
        url: 'https://example.com/nvidia-ai-demand',
        publishedDate: new Date(Date.now() - 7200000).toISOString(),
        tickers: ['NVDA'],
        tags: ['ai', 'semiconductors'],
        sentiment: 'positive'
    },
    {
        id: 4,
        title: 'Microsoft Azure Revenue Surges 29% on AI Services',
        description: 'Microsoft cloud division reports strong growth as enterprise customers adopt Azure OpenAI services.',
        source: 'Wall Street Journal',
        url: 'https://example.com/msft-azure',
        publishedDate: new Date(Date.now() - 10800000).toISOString(),
        tickers: ['MSFT'],
        tags: ['cloud', 'ai'],
        sentiment: 'positive'
    },
    {
        id: 5,
        title: 'Fed Signals Potential Rate Cuts in 2024',
        description: 'Federal Reserve officials indicate openness to interest rate cuts if inflation continues to moderate.',
        source: 'Financial Times',
        url: 'https://example.com/fed-rates',
        publishedDate: new Date(Date.now() - 14400000).toISOString(),
        tickers: ['SPY', 'QQQ'],
        tags: ['fed', 'rates', 'macro'],
        sentiment: 'neutral'
    }
];

export const MOCK_FUNDAMENTALS = {
    AAPL: {
        ticker: 'AAPL',
        period: 'Q4 2024',
        reportType: '10-Q',
        revenue: 89500000000,
        netIncome: 22960000000,
        grossProfit: 38500000000,
        operatingIncome: 27800000000,
        totalAssets: 352755000000,
        totalLiabilities: 290437000000,
        shareholderEquity: 62318000000,
        operatingCashFlow: 29500000000,
        eps: 1.46,
        roe: 36.8,
        roa: 6.5,
        debtToEquity: 4.66
    },
    TSLA: {
        ticker: 'TSLA',
        period: 'Q4 2024',
        reportType: '10-Q',
        revenue: 25170000000,
        netIncome: 2320000000,
        grossProfit: 4570000000,
        operatingIncome: 2060000000,
        totalAssets: 93941000000,
        totalLiabilities: 41134000000,
        shareholderEquity: 52807000000,
        operatingCashFlow: 4800000000,
        eps: 0.71,
        roe: 4.4,
        roa: 2.5,
        debtToEquity: 0.78
    },
    NVDA: {
        ticker: 'NVDA',
        period: 'Q4 2024',
        reportType: '10-Q',
        revenue: 18120000000,
        netIncome: 9240000000,
        grossProfit: 13400000000,
        operatingIncome: 10420000000,
        totalAssets: 65728000000,
        totalLiabilities: 22545000000,
        shareholderEquity: 43183000000,
        operatingCashFlow: 11500000000,
        eps: 3.71,
        roe: 21.4,
        roa: 14.1,
        debtToEquity: 0.52
    }
};

// ============== API FUNCTIONS ==============

/**
 * Check if using mock mode
 */
export function isMockMode() {
    return USE_MOCK;
}

/**
 * Get Tiingo axios instance
 */
export function getClient() {
    return tiingoAxios;
}

/**
 * Get mock stock data
 * @param {string} ticker - Stock ticker
 */
export function getMockStock(ticker) {
    const upper = ticker?.toUpperCase();
    return MOCK_STOCKS[upper] || null;
}

/**
 * Get mock news data
 * @param {string} ticker - Optional ticker filter
 */
export function getMockNews(ticker) {
    if (!ticker) return MOCK_NEWS;
    const upper = ticker.toUpperCase();
    return MOCK_NEWS.filter(n => n.tickers.includes(upper));
}

/**
 * Get mock fundamentals
 * @param {string} ticker - Stock ticker
 */
export function getMockFundamentals(ticker) {
    const upper = ticker?.toUpperCase();
    return MOCK_FUNDAMENTALS[upper] || null;
}

export default {
    isMockMode,
    getClient,
    getMockStock,
    getMockNews,
    getMockFundamentals,
    MOCK_STOCKS,
    MOCK_NEWS,
    MOCK_FUNDAMENTALS
};
