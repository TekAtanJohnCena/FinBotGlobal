import { useState } from "react";
import { addToPortfolio } from "../services/portfolio";

export default function AddToPortfolioModal({ userId, ticker, onClose, onAdded }) {
  const [shares, setShares] = useState(0);
  const [avgPrice, setAvgPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    await addToPortfolio(userId, { ticker, shares: Number(shares), avgPrice: Number(avgPrice) });
    setLoading(false);
    if (onAdded) onAdded();
    onClose();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-lg w-80">
        <h2 className="text-lg font-semibold mb-4">📌 {ticker.toUpperCase()} Portföyüne Ekle</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm">Lot Sayısı</label>
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              className="w-full rounded border px-2 py-1 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="block text-sm">Maliyet (₺)</label>
            <input
              type="number"
              value={avgPrice}
              onChange={(e) => setAvgPrice(e.target.value)}
              className="w-full rounded border px-2 py-1 dark:bg-zinc-800"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            className="px-3 py-1 rounded bg-zinc-300 dark:bg-zinc-700"
            onClick={onClose}
          >
            Vazgeç
          </button>
          <button
            className="px-3 py-1 rounded bg-emerald-600 text-white"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
