// PATH: src/components/FinanceChart.jsx
import React from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  CartesianGrid, ResponsiveContainer
} from "recharts";

export default function FinanceChart({ series, yUnit = "$", height = 400, theme = "dark" }) {
  if (!series || !series.length) return <div>Finansal veri bulunamadı</div>;

  // Serileri tek tabloya çevir (period bazlı merge)
  const merged = {};
  series.forEach(s => {
    s.points.forEach(p => {
      if (!merged[p.x]) merged[p.x] = { period: p.x };
      merged[p.x][s.id] = p.y;
    });
  });
  const data = Object.values(merged);

  return (
    <div className={theme === "dark" ? "bg-neutral-900 border border-zinc-700 rounded p-2" : "bg-white border border-zinc-300 rounded p-2"} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#444" : "#ccc"} />
          <XAxis dataKey="period" />
          <YAxis tickFormatter={(v) => new Intl.NumberFormat("tr-TR", { notation: "compact" }).format(v)} />
          <Tooltip formatter={(v) => `${v.toLocaleString("tr-TR")} ${yUnit}`} />
          <Legend />
          {series.map((s, i) => (
            <Line
              key={s.id}
              type="monotone"
              dataKey={s.id}
              stroke={["#10b981", "#3b82f6", "#f59e0b", "#ef4444"][i % 4]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
