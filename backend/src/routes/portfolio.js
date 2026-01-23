// PATH: backend/src/routes/portfolio.js
import express from "express";
import axios from "axios";
import Portfolio from "../models/Portfolio.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
const TIINGO_API_KEY = process.env.TIINGO_API_KEY;

// Helper: Determine Asset Type
const getAssetType = (symbol) => {
    const s = symbol.toLowerCase();
    const cryptoTickers = ['btcusd', 'ethusd', 'solusd', 'dogeusd', 'xrpusd', 'bnbusd', 'ltcusd', 'adausd', 'matikusd'];
    const forexTickers = ['eurusd', 'gbpusd', 'usdjpy', 'usdtry', 'audusd', 'usdcad', 'gbpjpy', 'xauusd'];

    if (cryptoTickers.includes(s) || (s.endsWith('usd') && s.length >= 6)) return 'CRYPTO';
    if (forexTickers.includes(s)) return 'FOREX';
    return 'STOCK';
};

/**
 * 1. GET PORTFOLIO
 */
router.get("/", protect, async (req, res) => {
    try {
        const assets = await Portfolio.find({ user: req.user._id }).sort({ createdAt: -1 });
        if (assets.length === 0) {
            return res.json({ ok: true, data: [], totals: { totalValue: 0, totalPnl: 0, totalPnlPercent: 0 } });
        }

        const enrichedData = await Promise.all(assets.map(async (asset) => {
            const type = getAssetType(asset.symbol);
            let currentPrice = 0;
            try {
                if (type === 'CRYPTO') {
                    const priceRes = await axios.get(`https://api.tiingo.com/tiingo/crypto/prices?tickers=${asset.symbol}&token=${TIINGO_API_KEY}`);
                    currentPrice = priceRes.data[0]?.priceData?.at(-1)?.last || 0;
                } else if (type === 'FOREX') {
                    const priceRes = await axios.get(`https://api.tiingo.com/tiingo/fx/top?tickers=${asset.symbol}&token=${TIINGO_API_KEY}`);
                    currentPrice = priceRes.data[0]?.lastPrice || priceRes.data[0]?.midPrice || 0;
                } else {
                    const priceRes = await axios.get(`https://api.tiingo.com/iex/?tickers=${asset.symbol}&token=${TIINGO_API_KEY}`);
                    currentPrice = priceRes.data[0]?.last || priceRes.data[0]?.tngoLast || priceRes.data[0]?.prevClose || 0;
                }
            } catch (err) {
                currentPrice = asset.avgCost;
            }
            return {
                id: asset._id, symbol: asset.symbol, name: asset.name, type: type,
                quantity: asset.quantity, avgCost: asset.avgCost, currentPrice: currentPrice,
                totalValue: currentPrice * asset.quantity, profit: (currentPrice - asset.avgCost) * asset.quantity,
                profitPercent: asset.avgCost > 0 ? ((currentPrice - asset.avgCost) / asset.avgCost) * 100 : 0
            };
        }));

        let totalValue = 0, totalCostBasis = 0;
        enrichedData.forEach(item => {
            totalValue += item.totalValue;
            totalCostBasis += (item.avgCost * item.quantity);
        });

        res.json({
            ok: true, data: enrichedData,
            totals: {
                totalValue, totalPnl: totalValue - totalCostBasis,
                totalPnlPercent: totalCostBasis > 0 ? ((totalValue - totalCostBasis) / totalCostBasis) * 100 : 0
            }
        });
    } catch (error) {
        res.status(500).json({ ok: false, error: "Portfolio fetch failed." });
    }
});

/**
 * 2. ADD / UPDATE ASSET
 */
router.post("/add", protect, async (req, res) => {
    try {
        const { symbol, name, quantity, avgCost } = req.body;
        const userId = req.user._id;
        if (!symbol || !quantity || !avgCost) return res.status(400).json({ ok: false, error: "Missing data." });

        const normalizedSymbol = symbol.toUpperCase();
        let asset = await Portfolio.findOne({ user: userId, symbol: normalizedSymbol });

        if (asset) {
            const oldTotalCost = asset.avgCost * asset.quantity;
            const newTotalCost = Number(avgCost) * Number(quantity);
            const totalQty = Number(asset.quantity) + Number(quantity);
            asset.avgCost = (oldTotalCost + newTotalCost) / totalQty;
            asset.quantity = totalQty;
            await asset.save();
            res.json({ ok: true, data: asset, message: "Updated." });
        } else {
            const newAsset = await Portfolio.create({
                user: userId, symbol: normalizedSymbol, name: name || normalizedSymbol,
                quantity: Number(quantity), avgCost: Number(avgCost)
            });
            res.status(201).json({ ok: true, data: newAsset, message: "Added." });
        }
    } catch (error) {
        res.status(500).json({ ok: false, error: "Failed to add." });
    }
});

/**
 * 3. DYNAMIC SEARCH WITH LIVE PRICES
 */
router.get("/search", protect, async (req, res) => {
    const { query } = req.query;
    if (!query) return res.json({ ok: true, data: [] });

    try {
        // Search metadata
        const searchRes = await axios.get(`https://api.tiingo.com/tiingo/utilities/search?query=${query}&token=${TIINGO_API_KEY}`);
        const results = searchRes.data.slice(0, 8); // Limit to top 8

        // Batch fetch prices for stocks
        const tickers = results.map(r => r.ticker).join(",");
        let livePrices = {};
        try {
            const priceRes = await axios.get(`https://api.tiingo.com/iex/?tickers=${tickers}&token=${TIINGO_API_KEY}`);
            priceRes.data.forEach(p => {
                livePrices[p.ticker.toUpperCase()] = p.last || p.tngoLast || p.prevClose || 0;
            });
        } catch (pErr) {
            console.error("Batch price fetch failed in search:", pErr.message);
        }

        const dataWithPrices = results.map(r => ({
            ...r,
            price: livePrices[r.ticker.toUpperCase()] || 0
        }));

        res.json({ ok: true, data: dataWithPrices });
    } catch (error) {
        res.status(500).json({ ok: false, error: "Search failed." });
    }
});

/**
 * 4. DELETE ASSET
 */
router.delete("/:id", protect, async (req, res) => {
    try {
        const deleted = await Portfolio.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!deleted) return res.status(404).json({ ok: false, error: "Not found." });
        res.json({ ok: true, message: "Deleted." });
    } catch (error) {
        res.status(500).json({ ok: false, error: "Delete failed." });
    }
});

export default router;
