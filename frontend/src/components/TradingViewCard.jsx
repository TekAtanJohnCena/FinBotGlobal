// PATH: src/components/TradingViewCard.jsx
import React, { useMemo } from "react";

/**
 * TradingView iFrame tabanlı gelişmiş grafik.
 * Props:
 *  - ticker: "AKBNK" vb. (zorunlu)
 *  - exchange: "BIST" | "NASDAQ" | ...
 *  - theme: "dark" | "light"
 *  - height: px
 *  - interval: "60" | "D" | "15"
 */
export default function TradingViewCard({
  ticker,
  exchange = "BIST",
  theme = "dark",
  height = 420,
  interval = "60",
}) {
  // Hook'lar koşulsuz çağrılır
  const symbol = `${exchange}:${String(ticker || "").toUpperCase()}`;

  const src = useMemo(() => {
    if (!ticker) return "";
    const params = new URLSearchParams({
      symbol,
      interval,
      theme: theme === "light" ? "Light" : "Dark",
      timezone: "Europe/Istanbul",
      locale: "tr",
      style: "1",
      hide_top_toolbar: "false",
      hide_legend: "false",
      withdateranges: "true",
      allow_symbol_change: "false",
      autosize: "true",
    });
    return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
  }, [ticker, symbol, interval, theme]);

  // Erken return, hook'lardan SONRA
  if (!ticker) return null;

  return (
    <div style={{ width: "100%", height }}>
      <iframe
        title={`tv-${symbol}`}
        src={src}
        width="100%"
        height="100%"
        frameBorder="0"
        allowTransparency={true}
        scrolling="no"
        style={{ borderRadius: 12, display: "block" }}
      />
    </div>
  );
}
