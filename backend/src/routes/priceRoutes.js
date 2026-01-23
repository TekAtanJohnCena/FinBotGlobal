import express from "express";
import { getCurrentPrice, searchTickers } from "../services/polygonService.js";
import { getBatchPrices } from "../services/tiingo/stockService.js";

const router = express.Router();

// Single stock price (US Market)
router.get("/:ticker", async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase().replace(".IS", ""); // Remove legacy BIST extension
    const quote = await getCurrentPrice(ticker);
    res.json({ ok: true, ticker, ...quote });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Price fetch failed", details: err.message });
  }
});

// Search tickers
router.get("/search/:query", async (req, res) => {
  try {
    const results = await searchTickers(req.params.query);
    res.json({ ok: true, results });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Search failed", details: err.message });
  }
});

// Bulk prices
router.get("/bulk/list", async (req, res) => {
  try {
    const tickers = (req.query.tickers || "").split(",").map(t => t.trim().toUpperCase().replace(".IS", "")).filter(Boolean);
    if (!tickers.length) return res.json({ ok: true, results: [] });

    const results = await Promise.all(
      tickers.map(async ticker => {
        try {
          const quote = await getCurrentPrice(ticker);
          return { ok: true, ticker, ...quote };
        } catch {
          return { ok: false, ticker, error: "Failed" };
        }
      })
    );

    res.json({ ok: true, results });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Bulk price fetch failed", details: err.message });
  }
});

// Batch prices (Tiingo based for live feed)
router.get("/batch", async (req, res) => {
  const { tickers } = req.query;
  if (!tickers) return res.status(400).json({ ok: false, error: "Tickers are required" });

  try {
    const tickerArray = tickers.split(',').map(t => t.trim().toUpperCase());
    const data = await getBatchPrices(tickerArray);

    // Transform to simple format: { "AAPL": 150.20 }
    const simpleFormat = {};
    Object.keys(data).forEach(ticker => {
      simpleFormat[ticker] = data[ticker].price;
    });

    res.json({ ok: true, data: simpleFormat });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Batch fetch failed" });
  }
});

export default router;

