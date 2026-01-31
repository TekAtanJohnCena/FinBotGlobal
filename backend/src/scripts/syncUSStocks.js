// PATH: backend/src/scripts/syncUSStocks.js
import "dotenv/config";
import mongoose from "mongoose";
import axios from "axios";
import Stock from "../models/Stock.js";

const TIINGO_API_KEY = process.env.TIINGO_API_KEY;
const MONGO_URI = process.env.MONGO_URI;

async function syncStocks() {
    if (!TIINGO_API_KEY || !MONGO_URI) {
        console.error("❌ Missing environment variables (TIINGO_API_KEY or MONGO_URI)");
        process.exit(1);
    }

    try {
        console.log("📡 Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ MongoDB Connected!");

        console.log("🔄 Fetching US Ticker Metadata from Tiingo (Fundamentals/Meta)...");
        // This endpoint provides ticker, name, sector, and industry for thousands of stocks
        const response = await axios.get(`https://api.tiingo.com/tiingo/fundamentals/meta?token=${TIINGO_API_KEY}`);

        const allTickers = response.data || [];
        console.log(`📊 Total tickers received: ${allTickers.length}`);

        // We only want active US stocks (not ETFs or Cryptos for this categorization, though we can adjust)
        // Tiingo fundamentals metadata specifically covers US stocks.
        const activeTickers = allTickers.filter(t => t.isActive === true);
        console.log(`🔍 Active US tickers: ${activeTickers.length}`);

        let count = 0;
        let upserted = 0;

        for (const t of activeTickers) {
            try {
                // Upsert logic: Update if exists, create if not
                await Stock.findOneAndUpdate(
                    { symbol: t.ticker.toUpperCase() },
                    {
                        symbol: t.ticker.toUpperCase(),
                        name: t.name || t.ticker,
                        exchange: t.exchangeCode || "US",
                        sector: t.sector || "Uncategorized",
                        industry: t.industry || "Uncategorized",
                        isActive: true
                    },
                    { upsert: true, new: true }
                );
                upserted++;

                if (upserted % 500 === 0) {
                    console.log(`⏳ Processed ${upserted} tickers...`);
                }
            } catch (err) {
                console.error(`❌ Error upserting ${t.ticker}:`, err.message);
            }
        }

        console.log(`✅ Successfully synced ${upserted} US stocks in total!`);
    } catch (error) {
        console.error("❌ Sync failed:", error.message);
    } finally {
        await mongoose.connection.close();
        console.log("🔌 MongoDB connection closed.");
        process.exit(0);
    }
}

syncStocks();
