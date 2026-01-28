// PATH: backend/src/controllers/stockAnalysisController.js
/**
 * Stock Analysis Controller - US Market Edition
 * Returns RAW financial data - AI scoring moved to /api/ai/stock-analyze
 */

import "dotenv/config";
// NOTE: OpenAI removed - use /api/ai/stock-analyze for AI scoring

// Tiingo Services
import { getPrice, getProfile } from "../services/tiingo/stockService.js";
import { getFundamentals, formatNumber } from "../services/tiingo/fundamentalsService.js";
import { getNews } from "../services/tiingo/newsService.js";

/**
 * Analyzes a stock - Returns RAW DATA ONLY (no AI)
 * For AI scoring, frontend should call /api/ai/stock-analyze
 */
export async function analyzeStock(req, res) {
  try {
    const { ticker } = req.body;

    if (!ticker) {
      return res.status(400).json({ error: "ticker is required" });
    }

    const normalizedTicker = ticker.toUpperCase().replace('.IS', '');

    // Fetch data from Tiingo
    const [priceData, profileData, fundamentalsData, newsData] = await Promise.all([
      getPrice(normalizedTicker).catch(() => null),
      getProfile(normalizedTicker).catch(() => null),
      getFundamentals(normalizedTicker).catch(() => null),
      getNews(normalizedTicker, 5).catch(() => [])
    ]);

    if (!priceData && !fundamentalsData) {
      return res.status(404).json({
        error: "Unable to fetch data for this ticker. Please try a major US stock like AAPL, TSLA, or NVDA."
      });
    }

    // Return raw financial data (NO AI scoring)
    const analysis = {
      ticker: normalizedTicker,
      company: profileData?.name || normalizedTicker,
      sector: profileData?.sector || 'N/A',
      industry: profileData?.industry || 'N/A',
      price: priceData?.price,
      change: priceData?.change,
      changePercent: priceData?.changePercent,
      volume: priceData?.volume,
      fundamentals: {
        revenue: fundamentalsData?.revenue,
        netIncome: fundamentalsData?.netIncome,
        grossProfit: fundamentalsData?.grossProfit,
        eps: fundamentalsData?.eps,
        roe: fundamentalsData?.roe,
        roa: fundamentalsData?.roa,
        debtToEquity: fundamentalsData?.debtToEquity,
        marketCap: profileData?.marketCap,
        peRatio: profileData?.peRatio
      },
      recentNews: newsData.slice(0, 3).map(n => ({
        title: n.title,
        source: n.source,
        date: n.publishedDate
      })),
      source: priceData?.source || 'tiingo',
      // NOTE: For AI scoring, call /api/ai/stock-analyze
      aiAnalysisAvailable: true
    };

    res.json(analysis);

  } catch (error) {
    console.error("Stock Analysis Error:", error);
    res.status(500).json({
      error: "Analysis failed",
      details: error.message
    });
  }
}

/**
 * Get quick stock summary - No AI
 */
export async function getStockSummary(req, res) {
  try {
    const { ticker } = req.params;
    const normalizedTicker = ticker?.toUpperCase().replace('.IS', '');

    if (!normalizedTicker) {
      return res.status(400).json({ error: "Ticker is required" });
    }

    const [priceData, profileData, fundamentalsData] = await Promise.all([
      getPrice(normalizedTicker).catch(() => null),
      getProfile(normalizedTicker).catch(() => null),
      getFundamentals(normalizedTicker).catch(() => null)
    ]);

    res.json({
      ticker: normalizedTicker,
      name: profileData?.name || normalizedTicker,
      sector: profileData?.sector,
      price: priceData?.price,
      change: priceData?.change,
      changePercent: priceData?.changePercent,
      volume: priceData?.volume,
      marketCap: profileData?.marketCap,
      eps: fundamentalsData?.eps,
      roe: fundamentalsData?.roe,
      peRatio: profileData?.peRatio,
      source: priceData?.source || 'tiingo'
    });

  } catch (error) {
    console.error("Stock Summary Error:", error);
    res.status(500).json({ error: "Failed to get stock summary" });
  }
}

/**
 * Compare two stocks - No AI
 */
export async function compareStocks(req, res) {
  try {
    const { ticker1, ticker2 } = req.body;

    if (!ticker1 || !ticker2) {
      return res.status(400).json({ error: "Two tickers are required" });
    }

    const t1 = ticker1.toUpperCase().replace('.IS', '');
    const t2 = ticker2.toUpperCase().replace('.IS', '');

    const [data1, data2] = await Promise.all([
      Promise.all([
        getPrice(t1).catch(() => null),
        getProfile(t1).catch(() => null),
        getFundamentals(t1).catch(() => null)
      ]),
      Promise.all([
        getPrice(t2).catch(() => null),
        getProfile(t2).catch(() => null),
        getFundamentals(t2).catch(() => null)
      ])
    ]);

    const [price1, profile1, fund1] = data1;
    const [price2, profile2, fund2] = data2;

    res.json({
      comparison: [
        {
          ticker: t1,
          name: profile1?.name || t1,
          sector: profile1?.sector,
          price: price1?.price,
          changePercent: price1?.changePercent,
          eps: fund1?.eps,
          roe: fund1?.roe,
          debtToEquity: fund1?.debtToEquity
        },
        {
          ticker: t2,
          name: profile2?.name || t2,
          sector: profile2?.sector,
          price: price2?.price,
          changePercent: price2?.changePercent,
          eps: fund2?.eps,
          roe: fund2?.roe,
          debtToEquity: fund2?.debtToEquity
        }
      ]
    });

  } catch (error) {
    console.error("Compare Stocks Error:", error);
    res.status(500).json({ error: "Comparison failed" });
  }
}

export default {
  analyzeStock,
  getStockSummary,
  compareStocks
};
