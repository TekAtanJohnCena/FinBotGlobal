// backend/src/services/portfolioService.js
import Portfolio from "../models/Portfolio.js";
import axios from "axios"; // fiyat çekmek için, senin mevcut endpointine de vurabiliriz

// 🔹 Tek bir hissenin anlık fiyatını getir (senin finance API’ne göre uyarlayabilirsin)
async function getPrice(ticker) {
  try {
    // Örn: kendi backend’inde /api/finance/quote?ticker=... varsa onu çağırabilirsin
    const res = await axios.get(`http://localhost:5000/api/finance/quote?ticker=${ticker}`);
    return res.data?.price || null;
  } catch (err) {
    console.error("Fiyat alınamadı:", ticker, err.message);
    return null;
  }
}

// 🔹 Kullanıcının portföyünü fiyat + K/Z ile getir
export async function getPortfolioWithMetrics(userId) {
  const portfolio = await Portfolio.findOne({ userId });
  if (!portfolio) return { userId, watchlist: [], totalValue: 0, totalPnL: 0 };

  let totalValue = 0;
  let totalCost = 0;

  const enriched = await Promise.all(
    portfolio.watchlist.map(async (item) => {
      const price = await getPrice(item.ticker);
      const currentValue = price ? price * item.shares : 0;
      const cost = item.avgPrice * item.shares;
      const pnl = price ? ((currentValue - cost) / cost) * 100 : 0;

      totalValue += currentValue;
      totalCost += cost;

      return {
        ...item.toObject(),
        price,
        currentValue,
        pnl, // yüzde olarak kar/zarar
      };
    })
  );

  const totalPnL = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

  return {
    userId,
    watchlist: enriched,
    totalValue,
    totalPnL,
  };
}
