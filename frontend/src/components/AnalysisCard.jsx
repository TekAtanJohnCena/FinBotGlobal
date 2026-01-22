// PATH: src/components/AnalysisCard.jsx
import React, { useState } from "react";
import MarketChart from "./MarketChart";
import { TrendingUp, Activity, PieChart, BarChart3, ChevronDown, ChevronUp, Layers } from "lucide-react";

export default function AnalysisCard({ a, theme = "dark" }) {
  const [showChart, setShowChart] = useState(false);

  if (!a) return null;

  // Formatting helpers
  const fmt = (v) => {
    if (v === null || v === undefined || v === "veri yok") return "—";
    const num = Number(v);
    if (isNaN(num)) return v;

    // Convert to readable abbreviation for Bento mini-tables if very large
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + "B";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";

    return num.toLocaleString("tr-TR");
  };

  const fmtNum = (v, suffix = "") => {
    if (v === null || v === undefined || v === "veri yok") return "—";
    const num = Number(v);
    if (isNaN(num)) return "—";
    return num.toLocaleString("tr-TR", { maximumFractionDigits: 2 }) + suffix;
  };

  const getRatioColor = (v) => {
    if (v === null || v === undefined) return "text-zinc-400";
    const str = String(v).replace("%", "").replace(",", ".");
    const num = parseFloat(str);
    if (isNaN(num)) return "text-zinc-400";
    return num < 0 ? "text-red-400" : "text-emerald-400";
  };

  // Mini-Table Row Component
  const DataRow = ({ label, value, colorClass = "text-white" }) => (
    <div className="flex justify-between items-center py-2 border-b border-zinc-700/30 last:border-0">
      <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-tight">{label}</span>
      <span className={`text-sm font-bold ${colorClass}`}>{value}</span>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto mt-4 px-1 md:px-0">
      <div className="bg-[#1e2025] border border-zinc-800 rounded-xl shadow-2xl p-4 md:p-6 flex flex-col max-h-[85vh] overflow-hidden">

        {/* 🚀 HEADER */}
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div className="flex items-center gap-2">
            <h4 className="text-xl font-black text-white tracking-tighter">
              {a.ticker?.toUpperCase()}
            </h4>
            <div className="h-4 w-px bg-zinc-700 mx-1" />
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Analiz Raporu</span>
          </div>
          <div className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-md text-[11px] font-black border border-purple-500/10">
            {a.year} {a.quarter}
          </div>
        </div>

        {/* 🍱 BENTO GRID (Scrollable) */}
        <div className="overflow-y-auto custom-scrollbar mt-4 pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Zone 1: Finansal Durum (Mini-Table) */}
            <div className="bg-zinc-800/40 p-4 rounded-xl border border-zinc-700/30 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={14} className="text-zinc-500" />
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Finansal Durum</span>
              </div>
              <div className="flex flex-col">
                <DataRow label="Net Kâr" value={`$${fmt(a.netIncome)}`} colorClass="text-emerald-400" />
                <DataRow label="Özkaynak" value={`$${fmt(a.equity)}`} />
                <DataRow label="Toplam Aktif" value={`$${fmt(a.totalAssets)}`} />
                {a.revenue && <DataRow label="Hasılat" value={`$${fmt(a.revenue)}`} />}
              </div>
            </div>

            {/* Zone 2: Oranlar (Mini-Table) */}
            <div className="bg-zinc-800/40 p-4 rounded-xl border border-zinc-700/30 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={14} className="text-zinc-500" />
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Önemli Oranlar</span>
              </div>
              <div className="flex flex-col">
                {Object.entries(a.ratios || {}).slice(0, 5).map(([k, v]) => (
                  <DataRow
                    key={k}
                    label={k.replace(/_/g, " ")}
                    value={v}
                    colorClass={getRatioColor(v)}
                  />
                ))}
              </div>
            </div>

            {/* Zone 3: Değerleme & Hedef (Featured Bottom Block) */}
            <div className="col-span-1 md:col-span-2 bg-indigo-900/10 border border-indigo-500/20 p-5 rounded-xl flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex flex-col items-center md:items-start">
                <span className="text-[10px] text-indigo-400/70 font-black uppercase tracking-widest mb-1">Ucuzluk Oranı</span>
                <div className={`text-3xl font-black tracking-tighter ${Number(a.ucuzluk_orani) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmtNum(a.ucuzluk_orani, "%")}
                </div>
              </div>

              <div className="hidden md:block w-px h-10 bg-indigo-500/10" />

              <div className="flex flex-col items-center md:items-end">
                <span className="text-[10px] text-indigo-400/70 font-black uppercase tracking-widest mb-1">Tahmini Hedef Fiyat</span>
                <div className="text-2xl font-black text-white tracking-tight">
                  {fmtNum(a.hedef_fiyat)} <span className="text-xs font-normal text-zinc-500 ml-0.5">TL</span>
                </div>
              </div>
            </div>

            {/* Optional Zone: Extras/Chart Hook */}
            {a.ticker && (
              <div className="col-span-1 md:col-span-2 pt-2">
                <button
                  onClick={() => setShowChart((v) => !v)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-zinc-800/30 hover:bg-zinc-800/50 transition-all border border-zinc-700/20 group"
                >
                  <div className="flex items-center gap-3">
                    <piechart size={16} className="text-zinc-500 group-hover:text-purple-400 transition-colors" />
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Teknik Görünüm</span>
                  </div>
                  {showChart ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
                </button>

                {showChart && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-zinc-800 bg-black/40">
                    <MarketChart
                      ticker={a.ticker}
                      exchange="BIST"
                      theme={theme}
                      height={400}
                      range="6mo"
                      interval="1d"
                      stooqInterval="d"
                    />
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ℹ️ FOOTER */}
        <div className="mt-4 pt-3 border-t border-zinc-800/50 flex justify-center shrink-0">
          <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">
            * Rasyonel Analiz Modeliyle Hazırlanmıştır
          </p>
        </div>
      </div>
    </div>
  );
}
