// PATH: src/components/MarketChart.jsx
import React, { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../lib/api";

const PRESETS = [
  { key: "5y", label: "5 Yıl", range: "5y", interval: "1wk", stooq: "w" },
  { key: "1y", label: "1 Yıl", range: "1y", interval: "1d", stooq: "d" },
  { key: "3mo", label: "3 Ay", range: "3mo", interval: "1d", stooq: "d" },
  { key: "1mo", label: "1 Ay", range: "1mo", interval: "1d", stooq: "d" },
  // 1 hafta ≈ 5 işlem günü
  { key: "1wk", label: "1 Hafta", range: "5d", interval: "1d", stooq: "d" },
  // intraday (destek yoksa otomatik 1d’ye düşer)
  { key: "1d", label: "1 Gün", range: "1d", interval: "5m", stooq: "m15" },
];

function cls(...xs) { return xs.filter(Boolean).join(" "); }

export default function MarketChart({
  ticker,                 // "AKBNK", "KCHOL" ...
  exchange = "NASDAQ",      // default exchange
  range = "6mo",
  interval = "1d",
  stooqInterval = "d",
  height = 420,
  theme = "dark",
}) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Aktif preset (props başlangıç varsayılanlarına göre)
  const initialKey = useMemo(() => {
    const hit = PRESETS.find(p => p.range === range && p.interval === interval);
    return hit?.key || "1y";
  }, [range, interval]);

  const [activeKey, setActiveKey] = useState(initialKey);

  const active = useMemo(
    () => PRESETS.find(p => p.key === activeKey) || PRESETS.find(p => p.key === "1y"),
    [activeKey]
  );

  // Tarih formatlayıcı (X ekseni)
  const tickFmt = (t) => {
    // data.t = "YYYY-MM-DD"
    if (!t) return "";
    if (active.key === "5y" || active.key === "1y") return t.slice(0, 7);     // YYYY-MM
    return t.slice(5); // MM-DD
  };

  // Tooltip format
  const tooltipFormatter = (value) => Number(value)?.toLocaleString("tr-TR", { maximumFractionDigits: 2 });

  useEffect(() => {
    if (!ticker) return;

    const sym = exchange.toUpperCase() === "BIST"
      ? `${String(ticker || "").toUpperCase()}.IS`
      : String(ticker || "").toUpperCase();

    async function fetchCandles(rng, ivl, stq) {
      // 1) İstenen interval ile dene
      const tryOnce = async (iv) => {
        const r = await api.get(`/finance/chart`, {
          params: { symbol: sym, range: rng, interval: iv, stooqInterval: stq },
        });
        if (r.data?.ok && Array.isArray(r.data.candles) && r.data.candles.length) {
          return r.data.candles.map(x => ({
            t: new Date(x.time).toISOString().slice(0, 10),
            close: Number(x.close),
          }));
        }
        throw new Error(r.data?.error || "Veri bulunamadı");
      };

      try {
        return await tryOnce(ivl);
      } catch {
        // 2) Intraday desteklenmiyorsa günlük veriye düş
        if (ivl !== "1d") {
          return await tryOnce("1d");
        }
        throw new Error("Veri alınamadı");
      }
    }

    (async () => {
      setLoading(true);
      setErr("");
      setData(null);
      try {
        const rows = await fetchCandles(active.range, active.interval, active.stooq);
        setData(rows);
      } catch (e) {
        setErr(e?.response?.data?.error || e.message || "Grafik verisi alınamadı.");
      } finally {
        setLoading(false);
      }
    })();
  }, [ticker, exchange, active.range, active.interval, active.stooq]);

  if (!ticker) return null;

  if (err) {
    return (
      <div className={theme === "dark" ? "p-3 text-sm text-red-300 bg-neutral-900 border border-red-700/50 rounded" : "p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded"}>
        {err}
      </div>
    );
  }

  if (!data || loading) {
    return (
      <div className={theme === "dark" ? "p-3 text-sm text-zinc-300 bg-neutral-900 border border-zinc-700 rounded" : "p-3 text-sm text-zinc-700 bg-white border border-zinc-300 rounded"}>
        {loading ? "Yükleniyor…" : "Veri yok"}
      </div>
    );
  }

  return (
    <div className={theme === "dark" ? "bg-neutral-900 border border-zinc-700 rounded p-2" : "bg-white border border-zinc-300 rounded p-2"} style={{ height }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {PRESETS.map(p => (
          <button
            key={p.key}
            type="button"
            onClick={() => setActiveKey(p.key)}
            className={cls(
              "px-3 py-1.5 rounded-xl text-xs border transition",
              p.key === activeKey
                ? "bg-zinc-900 text-white border-zinc-900"
                : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
            )}
            aria-pressed={p.key === activeKey}
            title={`${p.label} — range=${p.range}, interval=${p.interval}`}
          >
            {p.label}
          </button>
        ))}
        <div className="ml-auto text-[11px] text-zinc-500">
          Sembol: {String(ticker).toUpperCase()} • Aralık: {active.label}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeOpacity={theme === "dark" ? 0.1 : 0.2} />
          <XAxis dataKey="t" minTickGap={28} tickFormatter={tickFmt} />
          <YAxis domain={["auto", "auto"]} />
          <Tooltip formatter={tooltipFormatter} labelFormatter={(lb) => `Tarih: ${lb}`} />
          <Line type="monotone" dataKey="close" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>

      <p className="mt-1 text-[10px] text-zinc-500">
        Not: 1 Gün seçeneğinde intraday desteklenmiyorsa otomatik olarak günlük veriye geçilir.
      </p>
    </div>
  );
}
