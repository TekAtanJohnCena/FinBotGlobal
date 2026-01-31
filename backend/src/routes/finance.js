// PATH: backend/src/routes/finance.js
import express from "express";
import { getCurrentPrice, getFinancials, getCompanyProfile } from "../services/polygonService.js";

const router = express.Router();

function normalizeUSSymbol(raw) {
  const s = String(raw || "").trim().toUpperCase();
  if (!s) return null;
  return s; // Remove legacy BIST extension logic removed
}

/**
 * GET /api/finance/quote?symbol=AAPL
 */
router.get("/quote", async (req, res) => {
  try {
    const raw = (req.query.symbol || "").trim();
    if (!raw) return res.status(400).json({ ok: false, error: "symbol required" });

    const ticker = normalizeUSSymbol(raw);
    if (!ticker) return res.status(400).json({ ok: false, error: "invalid symbol" });

    const data = await getCurrentPrice(ticker);
    return res.json({ ok: true, ticker, ...data });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});

/**
 * GET /api/finance/quotes?symbols=AAPL,MSFT,GOOGL
 */
router.get("/quotes", async (req, res) => {
  try {
    const raw = (req.query.symbols || "").trim();
    if (!raw) return res.status(400).json({ ok: false, error: "symbols required (comma-separated)" });

    const list = raw.split(",").map(s => normalizeUSSymbol(s)).filter(Boolean);
    if (list.length === 0) return res.status(400).json({ ok: false, error: "no valid symbols" });

    const tasks = list.map(async (ticker) => {
      try {
        const data = await getCurrentPrice(ticker);
        return { ok: true, ticker, ...data };
      } catch (e) {
        return { ok: false, ticker, error: String(e?.message || e) };
      }
    });

    const out = await Promise.all(tasks);
    const results = out.filter(x => x.ok);
    const failed = out.filter(x => !x.ok).map(({ ticker, error }) => ({ ticker, error }));
    return res.json({ ok: true, results, failed });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});

/**
 * GET /api/finance/profile/:ticker
 */
router.get("/profile/:ticker", async (req, res) => {
  try {
    const ticker = normalizeUSSymbol(req.params.ticker);
    const profile = await getCompanyProfile(ticker);
    return res.json({ ok: true, ...profile });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});

/**
 * GET /api/finance/financials/:ticker
 */
router.get("/financials/:ticker", async (req, res) => {
  try {
    const ticker = normalizeUSSymbol(req.params.ticker);
    const period = req.query.period || "quarterly";
    const data = await getFinancials(ticker, period);
    return res.json({ ok: true, ...data });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});

router.get("/ping", (_req, res) => {
  res.json({ ok: true, service: "finance-us", ts: new Date().toISOString() });
});

export default router;

