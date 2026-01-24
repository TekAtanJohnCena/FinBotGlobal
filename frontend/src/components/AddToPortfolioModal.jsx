import { useState } from "react";
import { Search, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import api from "../lib/api";

export default function AddToPortfolioModal({ ticker: initialTicker, onClose, onAdded }) {
  const [ticker, setTicker] = useState(initialTicker?.toUpperCase() || "");
  const [shares, setShares] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [loading, setLoading] = useState(false);

  // Manual Entry State
  const [manualMode, setManualMode] = useState(!initialTicker);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState(null);

  // Validate ticker
  async function validateTicker(symbol) {
    if (!symbol || symbol.length < 1) {
      setValidationResult(null);
      return;
    }

    setValidating(true);
    setError(null);

    try {
      const res = await api.get(`/validate-ticker/${symbol}`);

      if (res.data.ok && res.data.valid) {
        setValidationResult({
          valid: true,
          symbol: res.data.symbol,
          name: res.data.name,
          price: res.data.price
        });

        if (res.data.price > 0 && !avgPrice) {
          setAvgPrice(res.data.price.toFixed(2));
        }
      } else {
        setValidationResult({ valid: false });
        setError('Geçersiz hisse sembolü');
      }
    } catch (err) {
      setError('Doğrulama başarısız');
      setValidationResult(null);
    } finally {
      setValidating(false);
    }
  }

  async function handleSave() {
    if (manualMode && (!validationResult || !validationResult.valid)) {
      setError('Lütfen geçerli bir hisse sembolü girin');
      return;
    }

    if (!shares || Number(shares) <= 0) {
      setError('Lütfen geçerli bir adet girin');
      return;
    }

    if (!avgPrice || Number(avgPrice) <= 0) {
      setError('Lütfen geçerli bir maliyet girin');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/portfolio/add', {
        symbol: ticker.toUpperCase(),
        name: validationResult?.name || ticker.toUpperCase(),
        quantity: Number(shares),
        avgCost: Number(avgPrice)
      });

      if (response.data.ok) {
        if (onAdded) onAdded();
        onClose();
      } else {
        setError(response.data.error || 'Ekleme hatası');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  function handleTickerChange(value) {
    setTicker(value.toUpperCase());
    setValidationResult(null);
    setError(null);
  }

  function handleTickerBlur() {
    if (manualMode && ticker) {
      validateTicker(ticker);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 p-4">
      <div className="bg-[#1a1d2e] p-6 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
          <Search className="w-5 h-5 text-indigo-400" />
          Portföye Ekle
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Hisse Sembolü
            </label>
            <div className="relative">
              <input
                type="text"
                value={ticker}
                onChange={(e) => handleTickerChange(e.target.value)}
                onBlur={handleTickerBlur}
                disabled={!manualMode && initialTicker}
                placeholder="AAPL, TSLA..."
                className="w-full rounded-lg border border-slate-600 px-4 py-2.5 bg-[#0f1117] text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {validating && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
                {!validating && validationResult?.valid && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                {!validating && validationResult && !validationResult.valid && <XCircle className="w-4 h-4 text-rose-400" />}
              </div>
            </div>
            {validationResult?.valid && (
              <p className="mt-2 text-xs text-emerald-400">✓ {validationResult.symbol}</p>
            )}
            {!initialTicker && !manualMode && (
              <button onClick={() => setManualMode(true)} className="mt-2 text-xs text-indigo-400 underline">
                Manuel gir
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Adet</label>
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="Kaç adet?"
              className="w-full rounded-lg border border-slate-600 px-4 py-2.5 bg-[#0f1117] text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Ortalama Maliyet ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={avgPrice}
              onChange={(e) => setAvgPrice(e.target.value)}
              placeholder="Hisse başına"
              className="w-full rounded-lg border border-slate-600 px-4 py-2.5 bg-[#0f1117] text-white"
            />
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/50 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <p className="text-sm text-rose-300">{error}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 px-5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold">
            Vazgeç
          </button>
          <button
            onClick={handleSave}
            disabled={loading || validating || (manualMode && !validationResult?.valid)}
            className="flex-1 px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Kaydediliyor</> : 'Ekle'}
          </button>
        </div>
      </div>
    </div>
  );
}
