import express from "express";
import axios from "axios";
import Portfolio from "../models/Portfolio.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
const TIINGO_API_KEY = process.env.TIINGO_API_KEY;

/**
 * 1. SEARCH ENDPOINT (Tiingo Utilities)
 * GET /api/portfolio/search?query=...
 */
router.get("/search", protect, async (req, res) => {
    const { query } = req.query;
    if (!query) return res.json({ ok: true, data: [] });

    try {
        const response = await axios.get(`https://api.tiingo.com/tiingo/utilities/search?query=${query}&token=${TIINGO_API_KEY}`);
        res.json({ ok: true, data: response.data });
    } catch (error) {
        console.error("Search API Error:", error.message);
        res.status(500).json({ ok: false, error: "Arama başarısız." });
    }
});

/**
 * 2. GET PORTFOLIO (With Real-Time IEX Prices & Fallbacks)
 * GET /api/portfolio
 */
router.get("/", protect, async (req, res) => {
    try {
        const assets = await Portfolio.find({ user: req.user._id }).sort({ createdAt: -1 });

        if (assets.length === 0) {
            return res.json({ ok: true, data: [], totals: { totalValue: 0, totalPnl: 0, totalPnlPercent: 0 } });
        }

        // A) Try Batch IEX Fetch First
        const symbols = assets.map(a => a.symbol).join(",");
        let livePrices = {};

        try {
            const priceRes = await axios.get(`https://api.tiingo.com/iex/?tickers=${symbols}&token=${TIINGO_API_KEY}`);
            priceRes.data.forEach(item => {
                livePrices[item.ticker.toUpperCase()] = item.tngoLast || item.last || 0;
            });
        } catch (pErr) {
            console.error("IEX Batch Fetch Error:", pErr.message);
        }

        let totalValue = 0;
        let totalCostBasis = 0;

        const enrichedData = await Promise.all(assets.map(async (asset) => {
            let currentPrice = livePrices[asset.symbol];

            // B) Fallback Mechanism: If IEX is 0 or missing, try Daily Prices
            if (!currentPrice || currentPrice === 0) {
                try {
                    const dailyRes = await axios.get(`https://api.tiingo.com/tiingo/daily/${asset.symbol}/prices?token=${TIINGO_API_KEY}`);
                    if (dailyRes.data && dailyRes.data.length > 0) {
                        currentPrice = dailyRes.data[0].close;
                        console.log(`Fallback Success for ${asset.symbol}: ${currentPrice}`);
                    }
                } catch (dErr) {
                    console.error(`Fallback failed for ${asset.symbol}:`, dErr.message);
                }
            }

            // Final fallback to avgCost to avoid 0s in UI
            if (!currentPrice || currentPrice === 0) {
                currentPrice = asset.avgCost;
            }

            const assetTotalValue = currentPrice * asset.quantity;
            const costBasis = asset.avgCost * asset.quantity;
            const profitValue = assetTotalValue - costBasis;
            const profitPercent = costBasis > 0 ? (profitValue / costBasis) * 100 : 0;

            totalValue += assetTotalValue;
            totalCostBasis += costBasis;

            return {
                id: asset._id,
                symbol: asset.symbol,
                name: asset.name,
                quantity: asset.quantity,
                avgCost: asset.avgCost,
                currentPrice: currentPrice,
                totalValue: assetTotalValue,
                profit: profitValue,
                profitPercent: profitPercent
            };
        }));

        res.json({
            ok: true,
            data: enrichedData,
            totals: {
                totalValue,
                totalPnl: totalValue - totalCostBasis,
                totalPnlPercent: totalCostBasis > 0 ? ((totalValue - totalCostBasis) / totalCostBasis) * 100 : 0
            }
        });
    } catch (error) {
        console.error("Get Portfolio Error:", error.message);
        res.status(500).json({ ok: false, error: "Portföy verileri alınamadı." });
    }
});

/**
 * 3. ADD / UPDATE ASSET (Weighted Average Cost)
 * POST /api/portfolio/add
 */
router.post("/add", protect, async (req, res) => {
    try {
        const { symbol, name, quantity, avgCost } = req.body;
        const userId = req.user._id;

        if (!symbol || !quantity || !avgCost) {
            return res.status(400).json({ ok: false, error: "Eksik veri." });
        }

        let asset = await Portfolio.findOne({ user: userId, symbol: symbol.toUpperCase() });

        if (asset) {
            const oldQty = asset.quantity;
            const oldCost = asset.avgCost;
            const newQty = Number(quantity);
            const newCost = Number(avgCost);

            asset.avgCost = ((oldCost * oldQty) + (newCost * newQty)) / (oldQty + newQty);
            asset.quantity = oldQty + newQty;
            await asset.save();
            res.json({ ok: true, data: asset, message: "Portföy güncellendi." });
        } else {
            const newAsset = await Portfolio.create({
                user: userId,
                symbol: symbol.toUpperCase(),
                name: name || symbol.toUpperCase(),
                quantity: Number(quantity),
                avgCost: Number(avgCost)
            });
            res.status(201).json({ ok: true, data: newAsset, message: "Hisse eklendi." });
        }
    } catch (error) {
        res.status(500).json({ ok: false, error: "Hisse eklenemedi." });
    }
});

/**
 * 4. DELETE ASSET
 * DELETE /api/portfolio/:id
 */
router.delete("/:id", protect, async (req, res) => {
    try {
        const deleted = await Portfolio.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!deleted) return res.status(404).json({ ok: false, error: "Kayıt bulunamadı." });
        res.json({ ok: true, message: "Hisse silindi." });
    } catch (error) {
        res.status(500).json({ ok: false, error: "Silme işlemi başarısız." });
    }
});

export default router;
