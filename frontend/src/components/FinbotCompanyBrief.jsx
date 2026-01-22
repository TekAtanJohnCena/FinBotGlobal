import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

/**
 * FinbotCompanyBrief
 * --------------------------------------------------------------
 * Bu bileşen, tek bir istek sonucunu aşağıdaki bloklarla gösterir:
 * - Soru (kullanıcının promptu)
 * - Trend Grafiği (son N çeyrek için tek bir metrik — default: Net Kar)
 * - Öne Çıkan Noktalar (LLM tarafından seçilen madde madde vurgular)
 * - AI Özeti (LLM kısa yorum)
 * - Bilanço Karşılaştırma (data/bist dosyasından gelen tablo)
 *
 * Beklenen API: GET /api/company/:ticker/summary?metric=net_profit&last=5
 * Dönen şema:
 * {
 *   question: string,
 *   ticker: string,
 *   metricLabel: string,        // grafikte gösterilecek metrik adı
 *   series: [{ q: "2024/Q1", value: number }, ...],
 *   key_points: [string, ...],  // 3-5 madde
 *   ai_summary: string,
 *   table: {
 *     columns: ["Kalem", "2023/Q4", "2024/Q1", ...],
 *     rows: [ { item: "Net Satışlar", values: [123, 140, ...] }, ... ]
 *   }
 * }
 */

export default function FinbotCompanyBrief() {
  const [ticker, setTicker] = useState("ASELS");
  const [metric, setMetric] = useState("net_profit"); // net_profit | revenue | ebitda | equity ...
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchData() {
    try {
      setLoading(true);
      setError("");
     const r = await fetch(`/api/company/${ticker}/summary?metric=${metric}&last=5`);

      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setData(j);
    } catch (e) {
      setError(e.message || "Veri alınamadı");
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, []);

  const chartData = useMemo(() => {
    if (!data?.series) return [];
    // Recharts için anahtarları sadeleştir
    return data.series.map(d => ({ name: d.q, value: d.value }));
  }, [data]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 grid gap-4">
      {/* Soru kutusu */}
      <Card className="bg-zinc-900/60 border-zinc-800 shadow-xl">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
            <div className="text-zinc-200 text-sm md:text-base flex-1">
              <span className="opacity-70 mr-2">Soru</span>
              <span className="font-medium">“{data?.question || `${ticker}’in son 5 çeyrek performansı nedir?`}”</span>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Input value={ticker} onChange={e=>setTicker(e.target.value.toUpperCase())} className="bg-zinc-800 border-zinc-700" placeholder="TICKER" />
              <Button onClick={fetchData} disabled={loading} className="min-w-[120px]">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2"/>Yükleniyor</> : "Yenile"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Üst grid: Trend + Öne Çıkanlar / AI Özeti */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend Grafiği */}
        <Card className="lg:col-span-2 bg-zinc-900/60 border-zinc-800 shadow-xl">
          <CardContent className="p-4 md:p-6">
            <div className="text-zinc-300 mb-3 font-medium">Trend Grafiği</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                  <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "#0B0B0B", border: "1px solid #27272a" }} labelClassName="text-zinc-200" />
                  <Line type="monotone" dataKey="value" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="pt-2 text-xs text-zinc-400">Gösterilen metrik: {data?.metricLabel || "Net Kar"}</div>
          </CardContent>
        </Card>

        {/* Öne Çıkan Noktalar + AI Özeti */}
        <Card className="bg-zinc-900/60 border-zinc-800 shadow-xl">
          <CardContent className="p-4 md:p-6 flex flex-col gap-6">
            <div>
              <div className="text-zinc-300 mb-2 font-medium">Öne Çıkan Noktalar</div>
              <ul className="space-y-2">
                {(data?.key_points || new Array(3).fill(null)).map((p, i) => (
                  <li key={i} className="text-sm text-zinc-300/90 bg-zinc-800/60 rounded-xl px-3 py-2 border border-zinc-800">
                    {p || <span className="opacity-40">• LLM tarafından önemli görülen madde...</span>}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-zinc-300 mb-2 font-medium">AI Özeti</div>
              <p className="text-sm text-zinc-300/90 bg-zinc-800/60 rounded-xl px-3 py-3 border border-zinc-800 leading-relaxed">
                {data?.ai_summary || "Son 5 çeyrekte dalgalı ancak yukarı yönlü bir eğilim gözleniyor. Operasyonel kârlılıkta toparlanma sinyalleri mevcut; nakit yaratımı ve stok devir hızı kıyaslaması iyileşme gösteriyor. (Örnek metin)"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bilanço Karşılaştırma Tablosu */}
      <Card className="bg-zinc-900/60 border-zinc-800 shadow-xl">
        <CardContent className="p-4 md:p-6">
          <div className="text-zinc-300 mb-3 font-medium">Bilanço Karşılaştırma</div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-zinc-400">
                  {(data?.table?.columns || ["Kalem", "2023/Q4", "2024/Q1", "2024/Q2", "2024/Q3", "2024/Q4"]).map((c, i) => (
                    <th key={i} className={`px-3 py-2 font-medium text-left ${i===0?"sticky left-0 bg-zinc-900/80 backdrop-blur": ""}`}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.table?.rows || demoRows()).map((row, idx) => (
                  <tr key={idx} className="border-t border-zinc-800">
                    <td className="px-3 py-2 text-zinc-200 sticky left-0 bg-zinc-900/80 backdrop-blur">{row.item}</td>
                    {row.values.map((v, j) => (
                      <td key={j} className="px-3 py-2 text-zinc-300/90 whitespace-nowrap">{formatNumber(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------- Helpers ----------------
function demoRows() {
  return [
    { item: "Net Satışlar", values: [1200, 1325, 1180, 1410, 1505] },
    { item: "Brüt Kâr", values: [380, 420, 395, 465, 472] },
    { item: "Faaliyet Kârı (EBIT)", values: [210, 245, 230, 290, 300] },
    { item: "Net Kâr", values: [95, 120, 90, 160, 145] },
    { item: "Özkaynaklar", values: [1600, 1660, 1725, 1800, 1880] }
  ];
}
function formatNumber(n) {
  if (n === null || n === undefined) return "-";
  const s = Number(n);
  if (Number.isNaN(s)) return String(n);
  // Kısa biçim: 1.2B, 340M, 15K
  const abs = Math.abs(s);
  if (abs >= 1e9) return (s/1e9).toFixed(1).replace(".0","") + "B";
  if (abs >= 1e6) return (s/1e6).toFixed(1).replace(".0","") + "M";
  if (abs >= 1e3) return (s/1e3).toFixed(1).replace(".0","") + "K";
  return s.toLocaleString("tr-TR");
}
