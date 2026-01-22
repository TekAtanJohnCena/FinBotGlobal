// PATH: src/components/TradingViewWidget.jsx
import React, { useEffect, useRef, memo } from "react";

function TradingViewWidget() {
  const container = useRef();

  useEffect(() => {
    // 👇 Önce temizle → çift widget oluşmaz
    if (container.current) {
      container.current.innerHTML = "";
    }

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-screener.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "market": "turkey",
        "showToolbar": false,
        "defaultColumn": "overview",
        "defaultScreen": "most_capitalized",
        "isTransparent": false,
        "locale": "tr",
        "colorTheme": "dark",
        "width": "100%",
        "height": 550
      }`;
    container.current.appendChild(script);
  }, []); // 👈 sadece ilk render’da çalışır

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
      <div className="tradingview-widget-copyright">
        <a
          href="https://tr.tradingview.com/screener/"
          rel="noopener noreferrer nofollow"
          target="_blank"
        >
          <span className="blue-text">
            Bütün piyasaları TradingView’de takip et
          </span>
        </a>
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);
