// PATH: backend/src/routes/stocks.js
import express from "express";
import { getStocks, seedStocks, getMarketStocks, searchStocksTiingo } from "../controllers/stockController.js";

const router = express.Router();

/**
 * @route GET /api/stocks
 * @desc Get all stocks with pagination and search
 */
router.get("/search", searchStocksTiingo);
router.get("/", getStocks);

/**
 * @route GET /api/stocks/market
 * @desc Get stocks for Market Page (Top list)
 */
router.get("/market", getMarketStocks);

/**
 * @route POST /api/stocks/seed
 * @desc Seed database with initial US stocks
 */
router.post("/seed", seedStocks);

export default router;
