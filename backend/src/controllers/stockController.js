import Stock from "../models/Stock.js";
import { INITIAL_US_STOCKS } from "../data/us/initialStocks.js";
import { searchTicker } from "../services/tiingo/stockService.js";
import { formatTicker } from "../utils/tickerFormatter.js";
import axios from "axios";

/**
 * Get all stocks (paginated)
 * @route GET /api/stocks
 */
export const getStocks = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const { search, type } = req.query;

        const query = { isActive: true };

        if (search) {
            query.$or = [
                { symbol: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } }
            ];
        }

        if (type) {
            query.assetType = type;
        }

        const stocks = await Stock.find(query)
            .sort({ popularityScore: -1, symbol: 1 })
            .skip(skip)
            .limit(limit);

        const total = await Stock.countDocuments(query);

        // IF DB IS EMPTY, RETURN SEED DATA DIRECTLY (Fallback mode)
        if (stocks.length === 0 && !search && page === 1) {
            return res.json({
                ok: true,
                data: INITIAL_US_STOCKS, // Fallback to memory list
                meta: { total: INITIAL_US_STOCKS.length, page, limit }
            });
        }

        res.json({
            ok: true,
            data: stocks,
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

/**
 * Seed database with initial US stocks
 * @route POST /api/stocks/seed
 */
export const seedStocks = async (req, res) => {
    try {
        const count = await Stock.countDocuments();
        if (count > 0 && req.query.force !== 'true') {
            return res.status(400).json({ ok: false, error: "Database already seeded. Use ?force=true to overwrite." });
        }

        if (req.query.force === 'true') {
            await Stock.deleteMany({});
        }

        // Insert seed data
        await Stock.insertMany(INITIAL_US_STOCKS);

        res.json({
            ok: true,
            message: `Successfully seeded ${INITIAL_US_STOCKS.length} stocks.`,
            count: INITIAL_US_STOCKS.length
        });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

// Simplified list for "Piyasa" page (Top stocks)
export const getMarketStocks = async (req, res) => {
    try {
        const { sector } = req.query;
        let query = { isActive: true };

        if (sector) {
            query.sector = sector;
        }

        const stocks = await Stock.find(query)
            .limit(30)
            .sort({ popularityScore: -1, symbol: 1 });

        if (stocks.length === 0 && !sector) {
            return res.json({ ok: true, data: INITIAL_US_STOCKS.slice(0, 30) });
        }

        res.json({ ok: true, data: stocks });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

/**
 * Search stocks via Tiingo API
 * @route GET /api/stocks/search
 */
export const searchStocksTiingo = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ ok: false, error: "Query parameter is required" });
        }

        // Auto-format query (e.g. BRK.A -> BRK-A) for better API searching
        const formattedQuery = formatTicker(query);

        const results = await searchTicker(formattedQuery);
        res.json({ ok: true, data: results });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};
