import { useEffect, useState, useCallback } from "react";
import { getPortfolioSummary, removeFromPortfolio } from "../services/portfolio";

export default function PortfolioTable({ userId }) {
  const [data, setData] = useState(null);

  // load fonksiyonunu useCallback ile sarmala
  const load = useCallback(async () => {
    const res = await getPortfolioSummary(userId);
    setData(res);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRemove(ticker) {
    await removeFromPortfolio(userId, ticker);
    load(); // tekrar yükle
  }

  if (!data) return <div>Yükleniyor…</div>;

  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 shadow p-4">
      <h2 className="text-lg font-semibold mb-4">📌 Portföyüm</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-zinc-500 border-b border-zinc-200 dark:border-zinc-700">
            <th>Hisse</th>
            <th>Lot</th>
            <th>Maliyet</th>
            <th>Fiyat</th>
            <th>Güncel Değer</th>
            <th>K/Z %</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.watchlist.map((item, idx) => (
            <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-800">
              <td className="py-2">{item.ticker.toUpperCase()}</td>
              <td>{item.shares}</td>
              <td>₺{item.avgPrice}</td>
              <td>{item.price ? `₺${item.price}` : "—"}</td>
              <td>₺{item.currentValue?.toLocaleString()}</td>
              <td className={item.pnl >= 0 ? "text-green-500" : "text-red-500"}>
                {item.pnl.toFixed(2)}%
              </td>
              <td>
                <button
                  className="text-xs px-2 py-1 rounded bg-red-500 text-white"
                  onClick={() => handleRemove(item.ticker)}
                >
                  Sil
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
