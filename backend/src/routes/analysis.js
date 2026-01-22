// PATH: backend/src/routes/analysis.js
/**
 * Analysis Routes - US Market Edition
 * Provides stock analysis endpoints using Tiingo data
 */

import express from "express";
import { analyzeStock, getStockSummary, compareStocks } from "../controllers/stockAnalysisController.js";
import { getPrice, getProfile } from "../services/tiingo/stockService.js";
import { getFundamentals } from "../services/tiingo/fundamentalsService.js";
import { analyzeQuarter } from "../services/analysis.js";

const router = express.Router();

/* ------------------ Routes ------------------ */

/**
 * GET /api/analysis/:ticker
 * Quick analysis for a single stock
 */
router.get("/:ticker", async (req, res) => {
  try {
    const { ticker } = req.params;
    const normalizedTicker = ticker?.toUpperCase().replace('.IS', '');

    if (!normalizedTicker) {
      return res.status(400).json({ ok: false, error: "Ticker is required" });
    }

    // Fetch data from Tiingo
    const [priceData, profileData, fundamentalsData] = await Promise.all([
      getPrice(normalizedTicker).catch(() => null),
      getProfile(normalizedTicker).catch(() => null),
      getFundamentals(normalizedTicker).catch(() => null)
    ]);

    if (!priceData && !fundamentalsData) {
      return res.status(404).json({
        ok: false,
        error: "No data found for this ticker. Try AAPL, TSLA, NVDA, MSFT, or GOOGL."
      });
    }

    // Run analysis
    const analysis = analyzeQuarter(fundamentalsData);

    res.json({
      ok: true,
      ticker: normalizedTicker,
      name: profileData?.name || normalizedTicker,
      sector: profileData?.sector,
      price: priceData?.price,
      change: priceData?.change,
      changePercent: priceData?.changePercent,
      fundamentals: {
        period: fundamentalsData?.period,
        revenue: fundamentalsData?.revenue,
        netIncome: fundamentalsData?.netIncome,
        eps: fundamentalsData?.eps,
        roe: fundamentalsData?.roe,
        roa: fundamentalsData?.roa,
        debtToEquity: fundamentalsData?.debtToEquity
      },
      analysis: analysis?.ratios,
      comments: analysis?.comments,
      source: priceData?.source || 'tiingo'
    });

  } catch (err) {
    console.error("Analysis route error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/analysis/stock
 * AI-powered stock analysis with scoring
 */
router.post("/stock", analyzeStock);

/**
 * GET /api/analysis/summary/:ticker
 * Quick stock summary
 */
router.get("/summary/:ticker", getStockSummary);

/**
 * POST /api/analysis/compare
 * Compare two stocks
 */
router.post("/compare", compareStocks);

export default router;
