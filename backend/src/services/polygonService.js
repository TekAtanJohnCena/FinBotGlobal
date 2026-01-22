// PATH: backend/src/services/polygonService.js

import axios from "axios";
import { getMockFinancials, getMockPrice, simulatePriceUpdate } from "../data/us/mockFinancials.js";

/**
 * Polygon.io Service for US Stock Market Data
 * Supports both real API calls and mock data fallback
 * Uses axios for HTTP requests instead of SDK
 */

const USE_MOCK_DATA = process.env.USE_MOCK_DATA === "true";
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
const POLYGON_TIER = process.env.POLYGON_TIER || "free";
const POLYGON_BASE_URL = "https://api.polygon.io";

// Log initialization
if (USE_MOCK_DATA) {
    console.log("🔄 Polygon service initialized in MOCK MODE");
} else if (POLYGON_API_KEY) {
    console.log("✅ Polygon.io service initialized with API key");
} else {
    console.log("⚠️  No Polygon API key found, using mock data");
}

/**
 * Search for US stock tickers
 * @param {string} query - Search query (e.g., "AAPL", "Apple")
 * @returns {Promise<Array>} - Array of matching tickers
 */
export async function searchTickers(query) {
    if (USE_MOCK_DATA || !POLYGON_API_KEY) {
        console.log("🔄 Using mock data for ticker search:", query);
        return getMockTickerSearch(query);
    }

    try {
        const response = await axios.get(`${POLYGON_BASE_URL}/v3/reference/tickers`, {
            params: {
                search: query,
                market: "stocks",
                active: true,
                limit: 10,
                apiKey: POLYGON_API_KEY,
            },
        });

        return response.data.results || [];
    } catch (error) {
        console.error("❌ Polygon API error (ticker search):", error.message);
        console.log("⚠️  Falling back to mock data");
        return getMockTickerSearch(query);
    }
}

/**
 * Get company details/profile
 * @param {string} ticker - Stock ticker (e.g., "AAPL")
 * @returns {Promise<Object>} - Company profile
 */
export async function getCompanyProfile(ticker) {
    if (USE_MOCK_DATA || !polygonClient) {
        console.log("🔄 Using mock data for company profile:", ticker);
        const mockData = getMockFinancials(ticker);
        if (!mockData) {
            throw new Error(`No mock data available for ticker: ${ticker}`);
        }
        return {
            ticker: mockData.ticker,
            name: mockData.name,
            description: mockData.description,
            ceo: mockData.ceo,
            sector: mockData.sector,
            industry: mockData.industry,
            marketCap: mockData.marketCap,
        };
    }

    try {
        const response = await polygonClient.reference.tickerDetails(ticker);
        return {
            ticker: response.results.ticker,
            name: response.results.name,
            description: response.results.description,
            ceo: response.results.ceo || "N/A",
            sector: response.results.sic_description || "N/A",
            industry: response.results.industry || "N/A",
            marketCap: response.results.market_cap || 0,
        };
    } catch (error) {
        console.error("❌ Polygon API error (company profile):", error.message);
        console.log("⚠️  Falling back to mock data");
        const mockData = getMockFinancials(ticker);
        if (!mockData) {
            throw new Error(`No data available for ticker: ${ticker}`);
        }
        return {
            ticker: mockData.ticker,
            name: mockData.name,
            description: mockData.description,
            ceo: mockData.ceo,
            sector: mockData.sector,
            industry: mockData.industry,
            marketCap: mockData.marketCap,
        };
    }
}

/**
 * Get financial statements (Income Statement, Balance Sheet, Cash Flow)
 * NOTE: This requires Advanced tier on Polygon.io
 * @param {string} ticker - Stock ticker
 * @param {string} period - "quarterly" or "annual"
 * @returns {Promise<Object>} - Financial data
 */
export async function getFinancials(ticker, period = "quarterly") {
    // Free tier doesn't support financials, always use mock data
    if (USE_MOCK_DATA || POLYGON_TIER === "free" || !polygonClient) {
        console.log("🔄 Using mock data for financials:", ticker);
        const mockData = getMockFinancials(ticker);
        if (!mockData) {
            throw new Error(`No mock financial data available for ticker: ${ticker}`);
        }

        return {
            ticker: mockData.ticker,
            name: mockData.name,
            period: period === "annual" ? mockData.annualFinancials.period : mockData.latestFinancials.period,
            reportType: period === "annual" ? mockData.annualFinancials.reportType : mockData.latestFinancials.reportType,
            financials: period === "annual" ? mockData.annualFinancials : mockData.latestFinancials,
            metrics: mockData.metrics,
        };
    }

    try {
        // This endpoint requires Advanced tier
        const response = await polygonClient.reference.stockFinancials({
            ticker,
            timeframe: period,
            limit: 1,
        });

        if (!response.results || response.results.length === 0) {
            throw new Error("No financial data returned from API");
        }

        const data = response.results[0];
        return {
            ticker,
            period: data.fiscal_period,
            reportType: data.filing_date ? "10-K" : "10-Q",
            financials: {
                revenues: data.financials?.income_statement?.revenues?.value || 0,
                netIncome: data.financials?.income_statement?.net_income_loss?.value || 0,
                totalAssets: data.financials?.balance_sheet?.assets?.value || 0,
                totalLiabilities: data.financials?.balance_sheet?.liabilities?.value || 0,
                shareholderEquity: data.financials?.balance_sheet?.equity?.value || 0,
                operatingCashFlow: data.financials?.cash_flow_statement?.net_cash_flow_from_operating_activities?.value || 0,
            },
        };
    } catch (error) {
        console.error("❌ Polygon API error (financials):", error.message);
        if (error.message.includes("403") || error.message.includes("401")) {
            console.log("⚠️  API tier doesn't support financials. Using mock data.");
        }

        // Fallback to mock data
        const mockData = getMockFinancials(ticker);
        if (!mockData) {
            throw new Error(`No financial data available for ticker: ${ticker}`);
        }

        return {
            ticker: mockData.ticker,
            name: mockData.name,
            period: period === "annual" ? mockData.annualFinancials.period : mockData.latestFinancials.period,
            reportType: period === "annual" ? mockData.annualFinancials.reportType : mockData.latestFinancials.reportType,
            financials: period === "annual" ? mockData.annualFinancials : mockData.latestFinancials,
            metrics: mockData.metrics,
        };
    }
}

/**
 * Get current stock price
 * @param {string} ticker - Stock ticker
 * @returns {Promise<Object>} - Price data
 */
export async function getCurrentPrice(ticker) {
    if (USE_MOCK_DATA || !polygonClient) {
        console.log("🔄 Using mock data for price:", ticker);
        const mockPrice = getMockPrice(ticker);
        if (!mockPrice) {
            throw new Error(`No mock price data available for ticker: ${ticker}`);
        }
        return mockPrice;
    }

    try {
        const response = await polygonClient.stocks.previousClose(ticker);
        if (!response.results || response.results.length === 0) {
            throw new Error("No price data returned from API");
        }

        const data = response.results[0];
        return {
            price: data.c, // Close price
            change: data.c - data.o, // Change from open
            changePercent: ((data.c - data.o) / data.o) * 100,
        };
    } catch (error) {
        console.error("❌ Polygon API error (price):", error.message);
        console.log("⚠️  Falling back to mock data");
        const mockPrice = getMockPrice(ticker);
        if (!mockPrice) {
            throw new Error(`No price data available for ticker: ${ticker}`);
        }
        return mockPrice;
    }
}

/**
 * Mock WebSocket price simulator
 * Since free tier doesn't support WebSocket, we simulate it
 * @param {string} ticker - Stock ticker
 * @param {Function} callback - Callback function to receive price updates
 * @returns {Object} - Object with stop() method to stop simulation
 */
export function subscribeToPriceUpdates(ticker, callback) {
    console.log("🔄 Starting mock WebSocket price simulation for:", ticker);

    // Simulate price updates every 3 seconds
    const interval = setInterval(() => {
        const priceUpdate = simulatePriceUpdate(ticker);
        if (priceUpdate) {
            callback(priceUpdate);
        }
    }, 3000);

    // Return object with stop method
    return {
        stop: () => {
            clearInterval(interval);
            console.log("⏹️  Stopped price simulation for:", ticker);
        }
    };
}

/**
 * Mock ticker search helper
 */
function getMockTickerSearch(query) {
    const allTickers = [
        { ticker: "AAPL", name: "Apple Inc.", market: "stocks" },
        { ticker: "TSLA", name: "Tesla, Inc.", market: "stocks" },
        { ticker: "NVDA", name: "NVIDIA Corporation", market: "stocks" },
        { ticker: "MSFT", name: "Microsoft Corporation", market: "stocks" },
        { ticker: "GOOGL", name: "Alphabet Inc.", market: "stocks" },
        { ticker: "AMZN", name: "Amazon.com, Inc.", market: "stocks" },
        { ticker: "META", name: "Meta Platforms, Inc.", market: "stocks" },
        { ticker: "BRK.B", name: "Berkshire Hathaway Inc.", market: "stocks" },
        { ticker: "JPM", name: "JPMorgan Chase & Co.", market: "stocks" },
        { ticker: "V", name: "Visa Inc.", market: "stocks" },
    ];

    const queryLower = query.toLowerCase();
    return allTickers.filter(
        (t) =>
            t.ticker.toLowerCase().includes(queryLower) ||
            t.name.toLowerCase().includes(queryLower)
    );
}

/**
 * Normalize US ticker (remove any .IS extensions if accidentally included)
 */
export function normalizeUSTicker(ticker) {
    if (!ticker) return null;

    // Remove .IS extension if present (legacy from BIST)
    let normalized = ticker.trim().toUpperCase().replace(".IS", "");

    return normalized;
}

/**
 * Get historical price data (for charts)
 * @param {string} ticker - Stock ticker
 * @param {string} timeframe - "day", "week", "month", "year"
 * @returns {Promise<Array>} - Array of price points
 */
export async function getHistoricalPrices(ticker, timeframe = "month") {
    if (USE_MOCK_DATA || !polygonClient) {
        console.log("🔄 Using mock data for historical prices:", ticker);
        return getMockHistoricalPrices(ticker, timeframe);
    }

    try {
        const to = new Date();
        const from = new Date();

        // Calculate date range based on timeframe
        switch (timeframe) {
            case "day":
                from.setDate(from.getDate() - 1);
                break;
            case "week":
                from.setDate(from.getDate() - 7);
                break;
            case "month":
                from.setMonth(from.getMonth() - 1);
                break;
            case "year":
                from.setFullYear(from.getFullYear() - 1);
                break;
        }

        const response = await polygonClient.stocks.aggregates(
            ticker,
            1,
            "day",
            from.toISOString().split("T")[0],
            to.toISOString().split("T")[0]
        );

        return response.results.map((item) => ({
            date: new Date(item.t).toISOString(),
            price: item.c,
            volume: item.v,
        }));
    } catch (error) {
        console.error("❌ Polygon API error (historical prices):", error.message);
        console.log("⚠️  Falling back to mock data");
        return getMockHistoricalPrices(ticker, timeframe);
    }
}

/**
 * Mock historical prices generator
 */
function getMockHistoricalPrices(ticker, timeframe) {
    const currentPrice = getMockPrice(ticker);
    if (!currentPrice) return [];

    const dataPoints = timeframe === "day" ? 24 : timeframe === "week" ? 7 : timeframe === "month" ? 30 : 365;
    const prices = [];

    for (let i = dataPoints; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        // Random walk around current price
        const randomFactor = 0.95 + Math.random() * 0.1; // ±5%
        const price = currentPrice.price * randomFactor;

        prices.push({
            date: date.toISOString(),
            price: parseFloat(price.toFixed(2)),
            volume: Math.floor(Math.random() * 10000000) + 1000000,
        });
    }

    return prices;
}

export default {
    searchTickers,
    getCompanyProfile,
    getFinancials,
    getCurrentPrice,
    subscribeToPriceUpdates,
    normalizeUSTicker,
    getHistoricalPrices,
};
