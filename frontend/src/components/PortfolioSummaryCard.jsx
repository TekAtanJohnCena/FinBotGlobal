import { useEffect, useState } from "react";
import { getPortfolioSummary } from "../services/portfolio";

export default function PortfolioSummaryCard({ userId }) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await getPortfolioSummary(userId);
    setSummary(res);
  }

  if (!summary) return null;

  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 shadow p-4">
      <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
        Portföy Özeti
      </h3>
      <div className="text-lg font-bold">₺{summary.totalValue.toLocaleString()}</div>
      <div
        className={`text-sm ${
          summary.totalPnL >= 0 ? "text-green-500" : "text-red-500"
        }`}
      >
        {summary.totalPnL.toFixed(2)}%
      </div>
    </div>
  );
}
