// PATH: backend/src/scripts/seedStocks.js
/**
 * Seed initial US stocks into MongoDB if the collection is empty.
 * This ensures the screener has data to display on first startup.
 */

import Stock from '../models/Stock.js';
import { INITIAL_US_STOCKS } from '../data/us/initialStocks.js';

/**
 * Seeds the Stock collection with initial US stocks.
 * Uses upsert to add missing stocks without duplicating existing ones.
 * @returns {Promise<boolean>} true if seeded/updated, false on error
 */
export async function seedInitialStocks() {
    try {
        const existingCount = await Stock.countDocuments();
        const targetCount = INITIAL_US_STOCKS.length;

        console.log(`📊 Stock DB has ${existingCount}/${targetCount} stocks`);

        // If all stocks exist, skip
        if (existingCount >= targetCount) {
            console.log('✅ All stocks already seeded. Skipping.');
            return false;
        }

        console.log('🌱 Seeding/updating Stock database with initial US stocks...');

        // Use bulkWrite with upsert to add missing stocks
        const operations = INITIAL_US_STOCKS.map(stock => ({
            updateOne: {
                filter: { symbol: stock.symbol },
                update: {
                    $setOnInsert: {
                        symbol: stock.symbol,
                        name: stock.name,
                        exchange: stock.exchange || 'NASDAQ',
                        sector: stock.sector || 'Unknown',
                        industry: stock.industry || 'Unknown',
                        assetType: stock.assetType || 'Stock',
                        isActive: true,
                        popularityScore: getPopularityScore(stock.symbol)
                    }
                },
                upsert: true
            }
        }));

        const result = await Stock.bulkWrite(operations, { ordered: false });

        const inserted = result.upsertedCount || 0;
        const updated = result.modifiedCount || 0;

        console.log(`✅ Seed complete: ${inserted} new stocks added, ${updated} existing stocks`);

        // Log final count
        const finalCount = await Stock.countDocuments();
        console.log(`📊 Total stocks in DB: ${finalCount}`);

        return inserted > 0;
    } catch (error) {
        console.error('❌ Stock seeding error:', error.message);
        return false;
    }
}

/**
 * Assign popularity scores based on well-known tickers
 */
function getPopularityScore(symbol) {
    const topTickers = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA'];
    const highTickers = ['JPM', 'V', 'MA', 'WMT', 'JNJ', 'UNH', 'XOM', 'PG', 'HD', 'BAC'];

    if (topTickers.includes(symbol)) return 100;
    if (highTickers.includes(symbol)) return 80;
    return 50;
}

export default { seedInitialStocks };
