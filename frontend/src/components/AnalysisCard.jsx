// PATH: src/components/AnalysisCard.jsx
import React from "react";
import { BarChart3, Newspaper } from "lucide-react";

export default function AnalysisCard({ a, theme = "dark" }) {
  // �️ Guard Clause
  if (!a) return null;

  // 🔍 DEBUG: Gelen ham veriyi konsola yazdır
  console.log("📊 AnalysisCard - Ham Veri (a):", JSON.stringify(a, null, 2));
  console.log("📊 AnalysisCard - a'nın KEY'leri:", Object.keys(a));

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. DATA UNWRAPPING (Veri Kökünü Tespit Et)
  // Bazen veri a.data veya a.result içinde gömülü gelir.
  // ═══════════════════════════════════════════════════════════════════════════
  const d = a.data || a.result || a.quote || a.fundamentals || a;

  // 🔍 DEBUG: Unwrap edilmiş veriyi yazdır
  console.log("📈 AnalysisCard - Unwrapped Veri (d):", JSON.stringify(d, null, 2));
  console.log("📈 AnalysisCard - d'nin KEY'leri:", Object.keys(d || {}));

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. ROBUST MAPPING - Backend formatlı değerleri öncelikli
  // Backend zaten "ebitdaFormatted": "35.93B" gibi değerler gönderiyor
  // ═══════════════════════════════════════════════════════════════════════════

  // Formatlı değerler (Backend'den hazır geliyor - öncelikli)
  const ebitdaFormatted = d.ebitdaFormatted || a.ebitdaFormatted;
  const netIncomeFormatted = d.netIncomeFormatted || a.netIncomeFormatted;
  const equityFormatted = d.equityFormatted || d.totalEquityFormatted || a.equityFormatted || a.totalEquityFormatted;
  const totalAssetsFormatted = d.totalAssetsFormatted || a.totalAssetsFormatted;
  const revenueFormatted = d.revenueFormatted || a.revenueFormatted;

  // Ham değerler (fallback için)
  const ebitdaRaw = d.ebitda || d.EBITDA || a.ebitda || 0;
  const netIncomeRaw = d.netIncome || d.net_income || d.netProfit || a.netIncome || 0;
  const equityRaw = d.totalEquity || d.equity || a.totalEquity || a.equity || 0;
  const totalAssetsRaw = d.totalAssets || d.total_assets || a.totalAssets || 0;
  const revenueRaw = d.totalRevenue || d.revenue || a.totalRevenue || a.revenue || 0;

  // MarketCap (Bu veri henüz backend'den gelmiyor - Tiingo Daily API'den çekilmeli)
  const marketCapFormatted = d.marketCapFormatted || a.marketCapFormatted;
  const marketCapRaw = d.marketCap || d.market_cap || a.marketCap || 0;

  const ticker = d.ticker || d.symbol || a.ticker || a.symbol || "UNKNOWN";
  const year = d.year || d.fiscalYear || a.year || new Date().getFullYear();
  const quarter = d.quarter || d.fiscalQuarter || a.quarter || "Q?";
  const reportDate = d.date || a.date;

  // Haberler dizisi
  const newsList = d.news || d.articles || a.news || a.articles || [];

  // 🔍 DEBUG: Final değerleri yazdır
  console.log("🎯 AnalysisCard - Final Values:", {
    ebitdaFormatted, netIncomeFormatted, equityFormatted, revenueFormatted,
    ticker, newsCount: newsList.length
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. FORMATTER (Hata Toleranslı)
  // ═══════════════════════════════════════════════════════════════════════════
  const fmt = (v) => {
    if (v === null || v === undefined || v === "" || v === "veri yok") return "—";

    // Eğer veri zaten string formatındaysa (örn: "1.2B") ve harfli ise, olduğu gibi bas
    if (typeof v === "string" && /[a-zA-Z]/.test(v)) return v;

    // Temizleme ve Sayıya Çevirme
    let num = Number(v);
    if (typeof v === "string") {
      // "$1,000.00" gibi gelirse temizle
      num = Number(v.replace(/[^0-9.-]+/g, ""));
    }

    if (isNaN(num) || num === 0) return "—";

    // Kısaltmalar
    if (Math.abs(num) >= 1_000_000_000_000) return (num / 1_000_000_000_000).toFixed(2) + "T";
    if (Math.abs(num) >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + "B";
    if (Math.abs(num) >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (Math.abs(num) >= 1_000) return (num / 1_000).toFixed(1) + "K";

    return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. YARDIMCI BİLEŞENLER
  // ═══════════════════════════════════════════════════════════════════════════
  const DataRow = ({ label, value, colorClass = "text-white" }) => (
    <div className="flex justify-between items-center py-2 border-b border-zinc-700/30 last:border-0">
      <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-tight">{label}</span>
      <span className={`text-sm font-bold ${colorClass}`}>{value}</span>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="w-full max-w-4xl mx-auto mt-4 px-1 md:px-0">
      <div className="bg-[#1e2025] border border-zinc-800 rounded-xl shadow-2xl p-4 md:p-6 flex flex-col max-h-[85vh] overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div className="flex items-center gap-2">
            <h4 className="text-xl font-black text-white tracking-tighter">{ticker.toUpperCase()}</h4>
            <div className="h-4 w-px bg-zinc-700 mx-1" />
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Analiz Raporu</span>
          </div>
          <div className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-md text-[11px] font-black border border-purple-500/10">
            {year} {quarter}
          </div>
        </div>

        {/* CONTENT */}
        <div className="overflow-y-auto custom-scrollbar mt-4 pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Zone 1: Finansal Durum */}
            <div className="bg-zinc-800/40 p-4 rounded-xl border border-zinc-700/30 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={14} className="text-zinc-500" />
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Finansal Durum</span>
              </div>
              <div className="flex flex-col">
                <DataRow label="Net Kâr" value={`$${netIncomeFormatted || fmt(netIncomeRaw)}`} colorClass="text-emerald-400" />
                <DataRow label="Özkaynak" value={`$${equityFormatted || fmt(equityRaw)}`} />
                <DataRow label="Toplam Aktif" value={`$${totalAssetsFormatted || fmt(totalAssetsRaw)}`} />
                <DataRow label="Hasılat" value={`$${revenueFormatted || fmt(revenueRaw)}`} />
              </div>
            </div>

            {/* Zone 2: Haberler */}
            <div className="bg-zinc-800/40 p-4 rounded-xl border border-zinc-700/30 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3">
                <Newspaper size={14} className="text-zinc-500" />
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Önemli Haberler</span>
              </div>
              <div className="flex flex-col gap-3">
                {newsList && newsList.length > 0 ? (
                  newsList.slice(0, 3).map((news, i) => (
                    <div key={i} className="flex flex-col border-b border-zinc-700/30 pb-2 last:border-0 last:pb-0">
                      <span className="text-xs font-bold text-white leading-tight hover:text-indigo-400 transition-colors cursor-pointer line-clamp-2">
                        {news.title}
                      </span>
                      <span className="text-[10px] text-zinc-500 mt-1 text-right">
                        {new Date(news.publishedDate || Date.now()).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500 italic">Haber akışı bulunamadı.</span>
                )}
              </div>
            </div>

            {/* Zone 3: Piyasa Değeri & FAVÖK */}
            <div className="col-span-1 md:col-span-2 bg-indigo-900/10 border border-indigo-500/20 p-5 rounded-xl flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex flex-col items-center md:items-start">
                <span className="text-[10px] text-indigo-400/70 font-black uppercase tracking-widest mb-1">Piyasa Değeri</span>
                <div className="text-3xl font-black text-white tracking-tighter">
                  ${marketCapFormatted || fmt(marketCapRaw) || '—'}
                </div>
              </div>
              <div className="hidden md:block w-px h-10 bg-indigo-500/10" />
              <div className="flex flex-col items-center md:items-end">
                <span className="text-[10px] text-indigo-400/70 font-black uppercase tracking-widest mb-1">FAVÖK</span>
                <div className="text-2xl font-black text-white tracking-tight">
                  ${ebitdaFormatted || fmt(ebitdaRaw)}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-4 pt-3 border-t border-zinc-800/50 flex justify-center shrink-0">
          <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">
            * Rasyonel Analiz Modeliyle Hazırlanmıştır
          </p>
        </div>
      </div>
    </div>
  );
}
