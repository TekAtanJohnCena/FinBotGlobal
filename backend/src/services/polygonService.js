// PATH: backend/src/services/polygonService.js
import axios from "axios";

const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
const POLYGON_BASE_URL = "https://api.polygon.io";

if (!POLYGON_API_KEY) {
    console.warn("⚠️ No Polygon API key found in .env");
} else {
    console.log("✅ Polygon.io service initialized with API key");
}

/**
 * Search for US stock tickers
 * @param {string} query - Search query (e.g., "AAPL", "Apple")
 * @returns {Promise<Array>} - Array of matching tickers
 */
export async function searchTickers(query) {
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
        throw error;
    }
}

/**
 * Get company details/profile
 * @param {string} ticker - Stock ticker (e.g., "AAPL")
 * @returns {Promise<Object>} - Company profile
 */
export async function getCompanyProfile(ticker) {
    try {
        const response = await axios.get(`${POLYGON_BASE_URL}/v3/reference/tickers/${ticker.toUpperCase()}`, {
            params: { apiKey: POLYGON_API_KEY }
        });
        const r = response.data.results;
        return {
            ticker: r.ticker,
            name: r.name,
            description: r.description,
            ceo: r.ceo || "N/A",
            sector: r.sic_description || "N/A",
            industry: r.industry || "N/A",
            marketCap: r.market_cap || 0,
        };
    } catch (error) {
        console.error("❌ Polygon API error (company profile):", error.message);
        throw error;
    }
}

/**
 * Get financial statements
 * @param {string} ticker - Stock ticker
 * @param {string} period - "quarterly" or "annual"
 */
export async function getFinancials(ticker, period = "quarterly") {
    try {
        const response = await axios.get(`${POLYGON_BASE_URL}/vX/reference/financials`, {
            params: {
                ticker: ticker.toUpperCase(),
                timeframe: period,
                limit: 1,
                apiKey: POLYGON_API_KEY
            }
        });

        if (!response.data.results || response.data.results.length === 0) {
            throw new Error("No financial data returned from API");
        }

        const data = response.data.results[0];
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
        throw error;
    }
}

/**
 * Get current stock price
 */
export async function getCurrentPrice(ticker) {
    try {
        const response = await axios.get(`${POLYGON_BASE_URL}/v2/aggs/ticker/${ticker.toUpperCase()}/prev`, {
            params: { apiKey: POLYGON_API_KEY }
        });

        const data = response.data.results?.[0];
        if (!data) throw new Error("No price data returned from API");

        return {
            price: data.c, // Close price
            change: data.c - data.o,
            changePercent: ((data.c - data.o) / data.o) * 100,
        };
    } catch (error) {
        console.error("❌ Polygon API error (price):", error.message);
        throw error;
    }
}

/**
 * Normalize US ticker
 */
export function normalizeUSTicker(ticker) {
    if (!ticker) return null;
    return ticker.trim().toUpperCase().replace(".IS", "");
}

/**
 * Get historical price data
 */
export async function getHistoricalPrices(ticker, timeframe = "month") {
    try {
        const to = new Date();
        const from = new Date();

        switch (timeframe) {
            case "day": from.setDate(from.getDate() - 1); break;
            case "week": from.setDate(from.getDate() - 7); break;
            case "month": from.setMonth(from.getMonth() - 1); break;
            case "year": from.setFullYear(from.getFullYear() - 1); break;
        }

        const response = await axios.get(`${POLYGON_BASE_URL}/v2/aggs/ticker/${ticker.toUpperCase()}/range/1/day/${from.toISOString().split("T")[0]}/${to.toISOString().split("T")[0]}`, {
            params: { apiKey: POLYGON_API_KEY }
        });

        return response.data.results?.map((item) => ({
            date: new Date(item.t).toISOString(),
            price: item.c,
            volume: item.v,
        })) || [];
    } catch (error) {
        console.error("❌ Polygon API error (historical prices):", error.message);
        throw error;
    }
}

export default {
    searchTickers,
    getCompanyProfile,
    getFinancials,
    getCurrentPrice,
    normalizeUSTicker,
    getHistoricalPrices,
};
