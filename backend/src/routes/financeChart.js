// PATH: backend/src/routes/financeChart.js
/**
 * Finance Chart Routes - US Market Edition
 * Provides historical chart data using Tiingo
 */

import express from "express";
import { getHistoricalPrices } from "../services/tiingo/stockService.js";

const router = express.Router();

/**
 * Helper: Parse date range to start/end dates
 */
function getDateRange(range) {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case '1d':
      start.setDate(start.getDate() - 1);
      break;
    case '5d':
      start.setDate(start.getDate() - 5);
      break;
    case '1mo':
      start.setMonth(start.getMonth() - 1);
      break;
    case '3mo':
      start.setMonth(start.getMonth() - 3);
      break;
    case '6mo':
      start.setMonth(start.getMonth() - 6);
      break;
    case '1y':
      start.setFullYear(start.getFullYear() - 1);
      break;
    case '5y':
      start.setFullYear(start.getFullYear() - 5);
      break;
    default:
      start.setMonth(start.getMonth() - 6); // Default 6 months
  }

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  };
}

/**
 * GET /api/finance/chart?symbol=AAPL&range=6mo
 * Returns OHLCV candle data for charting
 */
router.get("/chart", async (req, res) => {
  try {
    const raw = String(req.query.symbol || "").trim().toUpperCase();
    if (!raw) {
      return res.status(400).json({ ok: false, error: "symbol required" });
    }

    // Remove legacy .IS suffix for BIST compatibility - REMOVED
    const ticker = raw;
    const range = String(req.query.range || "6mo");

    console.log("[chart] Request:", { ticker, range });

    const { startDate, endDate } = getDateRange(range);

    const prices = await getHistoricalPrices(ticker, startDate, endDate);

    // Convert to candle format expected by frontend charts
    const candles = prices.map(p => ({
      time: new Date(p.date).getTime(),
      date: p.date,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume
    }));

    return res.json({
      ok: true,
      source: 'tiingo',
      symbol: ticker,
      range,
      startDate,
      endDate,
      candles
    });

  } catch (err) {
    console.error("[chart] Error:", err?.message);
    return res.status(500).json({
      ok: false,
      error: "Chart data fetch failed",
      details: err?.message
    });
  }
});

/**
 * GET /api/finance/candles/:ticker
 * Alternative endpoint for candle data
 */
router.get("/candles/:ticker", async (req, res) => {
  try {
    const ticker = req.params.ticker?.toUpperCase();
    const range = String(req.query.range || "3mo");

    const { startDate, endDate } = getDateRange(range);
    const prices = await getHistoricalPrices(ticker, startDate, endDate);

    const candles = prices.map(p => ({
      time: new Date(p.date).getTime(),
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume
    }));

    return res.json({ ok: true, ticker, candles });
  } catch (err) {
    console.error("[candles] Error:", err?.message);
    return res.status(500).json({ ok: false, error: err?.message });
  }
});

export default router;
