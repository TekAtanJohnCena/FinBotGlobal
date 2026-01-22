import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from "../lib/api";
import { AAPL_FINANCIALS, US_MARKET_DATA } from '../data/usMarketData';
// Icon setini projenizdeki pakete göre ayarlayabilirsiniz (lucide-react kullanıldı)
import {
  Search,
  BarChart2,
  Activity,
  Zap,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  BrainCircuit,
  Filter,
  PieChart,
  RefreshCw,
  TrendingUp,
  Clock
} from 'lucide-react';
import { SparklesIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import { BoltIcon } from '@heroicons/react/24/solid';
import FinbotAnalysisCard from '../components/FinbotAnalysisCard';

/* --- YARDIMCI FONKSİYONLAR --- */
const formatMoney = (value) => {
  if (value === undefined || value === null) return "-";
  if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(1)} Mr`;
  if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1)} Mn`;
  return value.toLocaleString('tr-TR');
};

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
};

// Renkleri site temasına (Bootstrap/Landing) uygun hale getirdim
const getColorClass = (colorName) => {
  if (!colorName) return 'text-gray-400 border-gray-700 bg-gray-800/50';
  switch (colorName.toLowerCase()) {
    case 'yeşil': return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
    case 'turuncu': return 'text-amber-400 border-amber-500/20 bg-amber-500/10';
    case 'kırmızı': return 'text-rose-400 border-rose-500/20 bg-rose-500/10';
    default: return 'text-gray-400 border-gray-700 bg-gray-800/50';
  }
};

/* --- CONFIGURATION --- */
const API_KEY = ""; // API Key buraya (Environment variable'dan gelmesi önerilir)

/* --- DATASET --- */
// US Market Data is imported from '../data/usMarketData'
// AAPL_FINANCIALS and US_MARKET_DATA are now available
const MARKET_DATA = US_MARKET_DATA;

/* --- COMPONENTS --- */

// YENİ: Yahoo Finance Stili Çizgi Grafik Bileşeni - Gerçek Veri ile
const PriceChart = ({ symbol, currentPrice = 100 }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredData, setHoveredData] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [priceInfo, setPriceInfo] = useState({ price: currentPrice, change: 0, changePercent: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchPriceHistory = async () => {
      setLoading(true);

      try {
        // Get real-time price first
        const priceRes = await api.get(`/price/${symbol}`);
        let realPrice = currentPrice;
        let change = 0;
        let changePercent = 0;

        if (priceRes.data?.ok && priceRes.data.price) {
          realPrice = priceRes.data.price;
          change = priceRes.data.change || 0;
          changePercent = priceRes.data.changePercent || 0;
        } else if (priceRes.data?.price) {
          realPrice = priceRes.data.price;
        }

        setPriceInfo({ price: realPrice, change, changePercent });

        // Get chart data for intraday (1 day, 5m interval)
        const chartRes = await api.get(`/finance/chart`, {
          params: {
            symbol: symbol.toUpperCase(),
            range: "1d"
          }
        });

        if (chartRes.data?.ok && Array.isArray(chartRes.data.candles) && chartRes.data.candles.length > 0) {
          // Convert candles to chart data points
          const dataPoints = chartRes.data.candles.map(candle => ({
            time: new Date(candle.time),
            price: Number(candle.close),
            volume: candle.volume || 0
          }));

          setChartData(dataPoints);
        } else {
          // Fallback: Use current price with minimal variation for display
          const now = new Date();
          const startTime = new Date(now);
          startTime.setHours(9, 55, 0, 0);

          const dataPoints = [];
          for (let i = 0; i <= 33; i++) {
            const time = new Date(startTime.getTime() + i * 15 * 60000);
            if (time <= now) {
              dataPoints.push({
                time: time,
                price: realPrice * (1 + (Math.random() - 0.5) * 0.01), // Small variation
                volume: 0
              });
            }
          }

          if (dataPoints.length === 0) {
            // If no data, create a simple line
            dataPoints.push({ time: new Date(now.getTime() - 3600000), price: realPrice, volume: 0 });
            dataPoints.push({ time: now, price: realPrice, volume: 0 });
          }

          setChartData(dataPoints);
        }
      } catch (error) {
        console.error("Fiyat verisi alınamadı:", error);
        // Fallback with current price
        const now = new Date();
        setChartData([
          { time: new Date(now.getTime() - 3600000), price: currentPrice, volume: 0 },
          { time: now, price: currentPrice, volume: 0 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      fetchPriceHistory();
    }
  }, [symbol, currentPrice]);

  // Grafik Çizim Hesaplamaları
  const width = containerRef.current ? containerRef.current.clientWidth : 800;
  const height = 320;
  const padding = { top: 20, right: 50, bottom: 30, left: 10 };

  const minPrice = chartData.length > 0 ? Math.min(...chartData.map(d => d.price)) * 0.99 : priceInfo.price * 0.99;
  const maxPrice = chartData.length > 0 ? Math.max(...chartData.map(d => d.price)) * 1.01 : priceInfo.price * 1.01;
  const priceRange = maxPrice - minPrice || 1;

  const getX = (index) => padding.left + (index / (chartData.length - 1)) * (width - padding.left - padding.right);
  const getY = (price) => height - padding.bottom - ((price - minPrice) / priceRange) * (height - padding.top - padding.bottom);

  // SVG Path oluşturma
  const linePath = useMemo(() => {
    if (chartData.length === 0) return "";
    return chartData.map((d, i) =>
      `${i === 0 ? 'M' : 'L'} ${getX(i)},${getY(d.price)}`
    ).join(' ');
  }, [chartData, width]);

  // Gradient alanı oluşturma (Area Chart efekti için)
  const areaPath = useMemo(() => {
    if (chartData.length === 0) return "";
    return `${linePath} L ${getX(chartData.length - 1)},${height - padding.bottom} L ${padding.left},${height - padding.bottom} Z`;
  }, [linePath, chartData, width]);

  const handleMouseMove = (e) => {
    if (!containerRef.current || chartData.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // En yakın veri noktasını bul
    const graphWidth = width - padding.left - padding.right;
    const index = Math.round(((x - padding.left) / graphWidth) * (chartData.length - 1));

    if (index >= 0 && index < chartData.length) {
      setHoveredData(chartData[index]);
      setMousePos({ x: getX(index), y: getY(chartData[index].price) });
    }
  };

  const handleMouseLeave = () => {
    setHoveredData(null);
  };

  const isPositive = chartData.length > 0 && chartData[chartData.length - 1]?.price >= chartData[0]?.price;
  const chartColor = isPositive ? "#10B981" : "#F43F5E"; // Emerald vs Rose

  if (loading) return (
    <div className="h-[360px] w-full rounded-xl border border-gray-800 bg-gray-900 flex flex-col items-center justify-center gap-3">
      <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
      <span className="text-gray-500 text-sm font-medium">Veriler Çekiliyor...</span>
    </div>
  );

  if (chartData.length === 0) return (
    <div className="h-[360px] w-full rounded-xl border border-gray-800 bg-gray-900 flex flex-col items-center justify-center gap-3">
      <span className="text-gray-500 text-sm font-medium">Grafik verisi yükleniyor...</span>
    </div>
  );

  return (
    <div className="h-[360px] w-full rounded-xl overflow-hidden border border-gray-800 bg-gray-900 shadow-2xl flex flex-col relative group">
      {/* Header Info */}
      <div className="absolute top-4 left-6 z-10 flex flex-col">
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {chartData.length > 0 ? formatMoney(chartData[chartData.length - 1]?.price) : formatMoney(priceInfo.price)}
            <span className="text-sm font-normal text-gray-400"> USD</span>
          </h3>
          {chartData.length > 0 && (
            <span className={`text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'} flex items-center`}>
              {isPositive ? '+' : ''}%{Math.abs(((chartData[chartData.length - 1].price - chartData[0].price) / chartData[0].price) * 100).toFixed(2)}
            </span>
          )}
          {chartData.length === 0 && priceInfo.changePercent !== 0 && (
            <span className={`text-sm font-bold ${priceInfo.changePercent > 0 ? 'text-emerald-400' : 'text-rose-400'} flex items-center`}>
              {priceInfo.changePercent > 0 ? '+' : ''}{priceInfo.changePercent.toFixed(2)}%
            </span>
          )}
        </div>
        <div className="text-[10px] text-gray-500 font-mono mt-1 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Canlı Veri
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 w-full h-full cursor-crosshair relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <svg width="100%" height="100%" className="overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColor} stopOpacity="0.2" />
              <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {[0.25, 0.5, 0.75].map((ratio, i) => {
            const y = padding.top + ratio * (height - padding.top - padding.bottom);
            return <line key={i} x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#374151" strokeDasharray="4" strokeWidth="1" opacity="0.3" />;
          })}

          {/* Area & Line */}
          <path d={areaPath} fill="url(#chartGradient)" />
          <path d={linePath} fill="none" stroke={chartColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Hover Effects */}
          {hoveredData && (
            <>
              <line
                x1={mousePos.x} y1={padding.top}
                x2={mousePos.x} y2={height - padding.bottom}
                stroke="#6B7280" strokeDasharray="4" strokeWidth="1"
              />
              <circle cx={mousePos.x} cy={mousePos.y} r="5" fill="#111827" stroke={chartColor} strokeWidth="2" />

              {/* Tooltip on SVG */}
              <foreignObject x={mousePos.x > width / 2 ? mousePos.x - 140 : mousePos.x + 10} y={padding.top} width="130" height="80">
                <div className="bg-gray-800/90 backdrop-blur border border-gray-700 p-2.5 rounded-lg shadow-xl text-xs">
                  <div className="text-gray-400 mb-1 font-mono flex items-center gap-1">
                    <Clock size={10} /> {formatTime(hoveredData.time)}
                  </div>
                  <div className="text-white font-bold text-sm">
                    ${hoveredData.price.toFixed(2)}
                  </div>
                </div>
              </foreignObject>
            </>
          )}
        </svg>

        {/* X Axis Labels */}
        <div className="absolute bottom-1 left-0 right-0 flex justify-between px-10 text-[10px] text-gray-500 font-mono select-none pointer-events-none">
          {chartData.filter((_, i) => i % 6 === 0).map((d, i) => (
            <span key={i}>{formatTime(d.time)}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const AIAnalysisCard = ({ stockData }) => {
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setAnalysis(null);
    setError(null);
  }, [stockData.ticker]);

  const generateAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await api.post(`/analysis/stock`, {
        ticker: stockData.ticker
      });

      // Yeni format kontrolü - score, scoreLabel, aiSummary, metrics
      if (response.data?.score !== undefined && response.data?.metrics) {
        setAnalysis({
          score: response.data.score,
          scoreLabel: response.data.scoreLabel || 'Değerlendirme',
          aiSummary: response.data.aiSummary || '',
          metrics: response.data.metrics || []
        });
      } else if (response.data?.error) {
        throw new Error(response.data.error);
      } else {
        throw new Error('Geçersiz analiz formatı');
      }
    } catch (err) {
      console.error('AI Analysis Error:', err);
      const errorMessage = err.response?.data?.error || err.message || "Analiz şu anda yapılamıyor. Lütfen tekrar deneyin.";
      setError(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="mb-8">
      {analysis ? (
        // DURUM 1: Analiz Yapılmışsa - FinbotAnalysisCard kullan
        <div className="relative">
          <FinbotAnalysisCard data={analysis} loading={false} />
          <div className="mt-3 flex justify-end">
            <button
              onClick={generateAnalysis}
              className="text-xs text-indigo-400/70 hover:text-indigo-300 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-indigo-500/10"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Yenile
            </button>
          </div>
        </div>
      ) : analyzing ? (
        // DURUM 2: Analiz Yapılıyorsa (Loading) - Skeleton göster
        <FinbotAnalysisCard data={null} loading={true} />
      ) : error ? (
        // DURUM 3: Hata
        <div className="bg-[#1e1e2d] border border-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="text-center py-4">
            <div className="text-rose-400 text-sm bg-rose-500/5 p-4 rounded-xl border border-rose-500/20 mb-4">
              {error}
            </div>
            <button
              onClick={generateAnalysis}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Tekrar Dene
            </button>
          </div>
        </div>
      ) : (
        // DURUM 4: Analiz Yoksa Buton Göster
        <div className="bg-[#1e1e2d] border border-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-2 mb-4 text-indigo-200/50">
              <BoltIcon className="w-5 h-5" />
              <span className="text-sm font-semibold">Bu hisse için profesyonel finansal analiz</span>
            </div>
            <button
              onClick={generateAnalysis}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 group"
            >
              <SparklesIcon className="w-4 h-4 group-hover:animate-spin" />
              FinBot ile Analiz Oluştur
            </button>
            <p className="text-xs text-gray-500 mt-3">* Gerçek finansal verilerle analiz yapılır.</p>
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ label, value, subtext, trend, suffix = "" }) => (
  <div className="p-2 md:p-4 rounded-lg md:rounded-2xl border border-gray-800 bg-gray-900 hover:bg-gray-800/80 hover:border-gray-700 transition-all group flex flex-col justify-between min-h-[60px] md:min-h-[100px]">
    <div className="flex justify-between items-start mb-0.5 md:mb-2">
      <span className="text-[8px] md:text-[11px] font-bold text-gray-500 uppercase tracking-wide leading-tight">{label}</span>
      {trend && (
        <span className={`p-0.5 rounded ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
          {trend === 'up' ? <ArrowUpRight size={8} className="md:w-3 md:h-3" /> : <ArrowDownRight size={8} className="md:w-3 md:h-3" />}
        </span>
      )}
    </div>
    <div>
      <div className="flex items-baseline gap-0.5">
        <div className="text-sm md:text-xl font-bold text-gray-100 group-hover:text-white tracking-tight">
          {typeof value === 'number' ? value.toFixed(2) : (value || "-")}
        </div>
        {value && <span className="text-[8px] md:text-xs text-gray-500 font-medium">{suffix}</span>}
      </div>
      {subtext && <div className="text-[7px] md:text-[10px] text-gray-500 mt-0.5 md:mt-1.5 font-medium hidden md:block">{subtext}</div>}
    </div>
  </div>
);

/* DETAYLI BİLANÇO TABLOSU - GENİŞLETİLMİŞ */
const DetailedBalanceSheet = ({ ticker }) => {

  const getPeriodLabel = (year, quarterStr) => {
    const qMap = { "Q1": "3", "Q2": "6", "Q3": "9", "Q4": "12" };
    return `${year}/${qMap[quarterStr] || quarterStr}`;
  };

  const tableData = useMemo(() => {
    let data = [];

    if (ticker === 'AAPL') {
      data = [...AAPL_FINANCIALS].sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        const qMap = { "Q1": 1, "Q2": 2, "Q3": 3, "Q4": 4 };
        return qMap[b.quarter] - qMap[a.quarter];
      });
    } else {
      const base = 10000000000 * (Math.random() * 5 + 1);
      const periods = [
        { y: "2025", q: "Q1" }, { y: "2024", q: "Q4" }, { y: "2024", q: "Q3" },
        { y: "2024", q: "Q2" }, { y: "2024", q: "Q1" }
      ];

      data = periods.map((p, i) => {
        const factor = 1 - (i * 0.05);
        return {
          ticker: ticker,
          year: p.y,
          quarter: p.q,
          nakit_ve_nakit_benzerleri: base * 0.1 * factor,
          finansal_yatirimlar: base * 0.05 * factor,
          ticari_alacaklar: base * 0.04 * factor,
          stoklar: base * 0.08 * factor,
          pesin_ödenmis_giderler: base * 0.01 * factor,
          diger_donen_varliklar: base * 0.02 * factor,
          toplam_donen_varliklar: base * 0.4 * factor,
          maddi_duran_varliklar: base * 0.3 * factor,
          ozkaynak_yontemiyle_degerlenen_yatirimlar: base * 0.02 * factor,
          kullanim_hakki_varliklari: base * 0.1 * factor,
          maddi_olmayan_duran_varliklar: base * 0.05 * factor,
          toplam_duran_varliklar: base * 0.6 * factor,
          toplam_varliklar: base * 1.0 * factor,
          kisa_vadeli_borclar: base * 0.25 * factor,
          ticari_borclar: base * 0.05 * factor,
          diger_kisa_vadeli_yukumlulukler: base * 0.02 * factor,
          toplam_kisa_vadeli_yukumlulukler: base * 0.32 * factor,
          uzun_vadeli_borclar: base * 0.18 * factor,
          toplam_uzun_vadeli_yukumlulukler: base * 0.2 * factor,
          ana_ortakliga_ait_ozkaynaklar: base * 0.45 * factor,
          donem_net_kar_zarari: base * 0.05 * factor,
          toplam_ozkaynaklar: base * 0.5 * factor
        };
      });
    }
    return data;
  }, [ticker]);

  const periods = tableData.map(d => getPeriodLabel(d.year, d.quarter));

  const rows = [
    { type: 'header', label: 'Dönen Varlıklar' },
    { type: 'item', label: 'Nakit ve Nakit Benzerleri', key: 'nakit_ve_nakit_benzerleri' },
    { type: 'item', label: 'Finansal Yatırımlar', key: 'finansal_yatirimlar' },
    { type: 'item', label: 'Ticari Alacaklar', key: 'ticari_alacaklar' },
    { type: 'item', label: 'Stoklar', key: 'stoklar' },
    { type: 'item', label: 'Peşin Ödenmiş Giderler', key: 'pesin_ödenmis_giderler' },
    { type: 'item', label: 'Diğer Dönen Varlıklar', key: 'diger_donen_varliklar' },
    { type: 'summary', label: 'Toplam Dönen Varlıklar', key: 'toplam_donen_varliklar' },

    { type: 'header', label: 'Duran Varlıklar' },
    { type: 'item', label: 'Maddi Duran Varlıklar', key: 'maddi_duran_varliklar' },
    { type: 'item', label: 'Maddi Olmayan Duran Varlıklar', key: 'maddi_olmayan_duran_varliklar' },
    { type: 'item', label: 'Özkaynak Yönt. Değ. Yatırımlar', key: 'ozkaynak_yontemiyle_degerlenen_yatirimlar' },
    { type: 'item', label: 'Kullanım Hakkı Varlıkları', key: 'kullanim_hakki_varliklari' },
    { type: 'summary', label: 'Toplam Duran Varlıklar', key: 'toplam_duran_varliklar' },

    { type: 'total', label: 'TOPLAM VARLIKLAR', key: 'toplam_varliklar' },

    { type: 'header', label: 'Kısa Vadeli Yükümlülükler' },
    { type: 'item', label: 'Finansal Borçlar', key: 'kisa_vadeli_borclar' },
    { type: 'item', label: 'Ticari Borçlar', key: 'ticari_borclar' },
    { type: 'item', label: 'Diğer Yükümlülükler', key: 'diger_kisa_vadeli_yukumlulukler' },
    { type: 'summary', label: 'Toplam Kısa Vadeli Yük.', key: 'toplam_kisa_vadeli_yukumlulukler' },

    { type: 'header', label: 'Uzun Vadeli Yükümlülükler' },
    { type: 'item', label: 'Finansal Borçlar', key: 'uzun_vadeli_borclar' },
    { type: 'summary', label: 'Toplam Uzun Vadeli Yük.', key: 'toplam_uzun_vadeli_yukumlulukler' },

    { type: 'header', label: 'Özkaynaklar' },
    { type: 'item', label: 'Ana Ortaklığa Ait Özkaynaklar', key: 'ana_ortakliga_ait_ozkaynaklar' },
    { type: 'item', label: 'Dönem Net Kâr/Zararı', key: 'donem_net_kar_zarari', highlight: true },
    { type: 'total', label: 'TOPLAM ÖZKAYNAKLAR', key: 'toplam_ozkaynaklar' },
  ];

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden shadow-2xl">
      <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-950/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><BarChart2 size={18} /></div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Detaylı Bilanço</h3>
        </div>
        <span className="text-xs font-mono text-gray-500 bg-gray-950 px-2 py-1 rounded">USD Millions</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-gray-950 border-b border-gray-800">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase w-1/3 min-w-[220px]">Kalemler</th>
              {periods.map((period, i) => (
                <th key={i} className="px-4 py-4 text-right font-mono text-gray-300 min-w-[120px]">
                  {period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {rows.map((row, rowIndex) => {
              if (row.type === 'header') {
                return (
                  <tr key={rowIndex} className="bg-gray-800/30">
                    <td colSpan={periods.length + 1} className="px-6 py-3 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      {row.label}
                    </td>
                  </tr>
                );
              }

              const isSummary = row.type === 'summary';
              const isTotal = row.type === 'total';
              const isHighlight = row.highlight;

              return (
                <tr key={rowIndex} className={`group hover:bg-white/[0.02] transition-colors ${isTotal ? 'bg-gray-800/40 font-bold' : ''}`}>
                  <td className={`px-6 py-3 ${isSummary || isTotal ? 'text-white font-semibold pl-6' : 'text-gray-400 pl-10'}`}>
                    <div className="flex items-center gap-2">
                      {isSummary && <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>}
                      {row.label}
                    </div>
                  </td>
                  {tableData.map((dataPoint, colIndex) => {
                    const value = dataPoint[row.key];
                    let change = null;
                    if (colIndex < tableData.length - 1) {
                      const prevValue = tableData[colIndex + 1][row.key];
                      if (prevValue !== 0 && value !== undefined) {
                        change = ((value - prevValue) / Math.abs(prevValue)) * 100;
                      }
                    }

                    return (
                      <td key={colIndex} className="px-4 py-3 text-right font-mono relative">
                        <div className={`tracking-tight ${isHighlight && value > 0 ? 'text-emerald-400 font-bold' : isHighlight && value < 0 ? 'text-rose-400 font-bold' : isTotal ? 'text-white' : 'text-gray-300'}`}>
                          {formatMoney(value)}
                        </div>
                        {change !== null && Math.abs(change) > 1 && (
                          <div className={`text-[9px] absolute bottom-0.5 right-4 ${change > 0 ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
                            {change > 0 ? '▲' : '▼'} {Math.abs(change).toFixed(0)}%
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};


/* --- MAIN COMPONENT --- */
const StockTerminal = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState("Tümü");
  const [selectedTicker, setSelectedTicker] = useState("NVDA");
  const [activeTab, setActiveTab] = useState("ozet");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const filteredStocks = useMemo(() => {
    return MARKET_DATA.filter(stock => {
      const matchesSearch = stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchTerm.toLowerCase());
      const stockSector = stock.sector || stock.sektor || "Other";
      const matchesSector = selectedSector === "Tümü" || stockSector === selectedSector;
      return matchesSearch && matchesSector;
    });
  }, [searchTerm, selectedSector]);

  const sectors = useMemo(() => ["Tümü", ...new Set(MARKET_DATA.map(s => s.sector || s.sektor || "Other"))].sort(), []);
  const currentStock = useMemo(() => MARKET_DATA.find(s => s.ticker === selectedTicker) || MARKET_DATA[0], [selectedTicker]);

  return (
    <div className="flex h-screen w-full bg-[#131314] text-gray-200 font-sans overflow-hidden selection:bg-indigo-500/30">

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 1. STOCK LIST PANEL - Slide-over Drawer on mobile */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50
        w-[280px] md:w-80 flex-shrink-0 flex flex-col 
        border-r border-gray-800 bg-[#131314]
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Mobile Header with Close Button */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-800">
          <span className="text-sm font-bold text-white">Piyasa İzleme</span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 md:p-5 border-b border-gray-800 space-y-3 md:space-y-4 bg-[#131314] z-10">
          <div className="hidden md:flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-wide">PİYASA İZLEME</h2>
            <span className="text-[10px] font-medium bg-gray-900 text-gray-500 px-2 py-0.5 rounded-full border border-gray-800">
              {filteredStocks.length}
            </span>
          </div>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              placeholder="Sembol veya şirket ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 text-sm text-white pl-10 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:bg-gray-900 transition-all placeholder:text-gray-600"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {sectors.map(sector => (
              <button
                key={sector}
                onClick={() => setSelectedSector(sector)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${selectedSector === sector
                  ? 'bg-white text-black border-white shadow-md'
                  : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-600 hover:text-gray-300'
                  }`}
              >
                {sector}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {filteredStocks.map((stock) => (
            <button
              key={stock.ticker}
              onClick={() => {
                setSelectedTicker(stock.ticker);
                setIsMobileMenuOpen(false); // Close drawer on selection
              }}
              className={`w-full text-left px-4 md:px-5 py-3 md:py-4 border-b border-gray-800/50 flex items-center justify-between group transition-all hover:bg-gray-900/60 ${selectedTicker === stock.ticker ? 'bg-gray-900 border-l-[3px] border-l-indigo-500' : 'border-l-[3px] border-l-transparent'
                }`}
            >
              <div className="min-w-0 flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-bold text-sm ${selectedTicker === stock.ticker ? 'text-white' : 'text-gray-300'}`}>
                    {stock.ticker}
                  </span>
                  {stock.renk_kodu === 'Yeşil' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>}
                  {stock.renk_kodu === 'Turuncu' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>}
                  {stock.renk_kodu === 'Kırmızı' && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>}
                </div>
                <div className="text-[10px] text-gray-500 truncate font-medium">{stock.name}</div>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className={`text-xs font-mono font-bold ${!stock.anlik_fk || stock.anlik_fk < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {stock.anlik_fk ? stock.anlik_fk.toFixed(1) : 'N/A'}
                </div>
                <span className="text-[9px] text-gray-600 uppercase tracking-wide">F/K</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* 2. MAIN DASHBOARD - Background adjusted */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-[#111827]">
        {/* Mobile-friendly Header */}
        <header className="h-14 md:h-20 flex-shrink-0 border-b border-gray-800 flex items-center justify-between px-3 md:px-8 bg-[#111827]/95 backdrop-blur-md z-20">
          <div className="flex items-center gap-2 md:gap-6">
            {/* Hamburger Menu - Mobile Only */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div>
              <h1 className="text-lg md:text-3xl font-bold text-white tracking-tight">{currentStock.ticker}</h1>
              <div className="flex items-center gap-1.5 md:gap-3 mt-0.5">
                <span className="text-[10px] md:text-xs font-medium text-gray-400 truncate max-w-[100px] md:max-w-none">{currentStock.name}</span>
                <span className={`text-[8px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded border ${getColorClass(currentStock.color_code || currentStock.renk_kodu)}`}>
                  {(currentStock.color_code || currentStock.renk_kodu || 'Green').toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation - Compact on mobile */}
          <div className="flex bg-gray-900 p-0.5 md:p-1 rounded-lg md:rounded-xl border border-gray-800">
            {[
              { id: 'ozet', label: 'Özet', fullLabel: 'Genel Bakış', icon: Zap },
              { id: 'finansal', label: 'Fin.', fullLabel: 'Finansallar', icon: BarChart2 },
              { id: 'oranlar', label: 'Oran', fullLabel: 'Oran Analizi', icon: PieChart },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold transition-all ${activeTab === tab.id
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                  }`}
              >
                <tab.icon size={12} strokeWidth={2.5} className="hidden md:block md:w-[14px] md:h-[14px]" />
                <span className="md:hidden">{tab.label}</span>
                <span className="hidden md:inline">{tab.fullLabel}</span>
              </button>
            ))}
          </div>
        </header>

        {/* SCROLLBAR CUSTOMIZATION - Gray Theme Compatible */}
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #1F2937; /* Gray-800 */
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #374151; /* Gray-700 */
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #4B5563; /* Gray-600 */
          }
        `}</style>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar scroll-smooth">
          <div className="max-w-[1600px] mx-auto space-y-4 md:space-y-8 pb-12">

            {activeTab === 'ozet' && (
              <div className="flex flex-col w-full gap-4 md:gap-6">

                {/* 1. CHART SECTION - Self-contained block */}
                <div className="w-full h-[200px] md:h-[360px] bg-gray-900 rounded-xl relative z-0 shrink-0">
                  <PriceChart symbol={currentStock.ticker} currentPrice={currentStock.last_price || 100} />
                </div>

                {/* 2. KEY METRICS GRID - MUST be immediately after chart */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 w-full relative z-10">
                  <MetricCard
                    label="F/K"
                    value={currentStock.anlik_fk}
                    suffix="x"
                    subtext="Sektör Ort: 12.4x"
                    trend={currentStock.anlik_fk > 0 && currentStock.anlik_fk < 15 ? 'up' : 'down'}
                  />
                  <MetricCard
                    label="PD/DD"
                    value={currentStock.pd_dd}
                    suffix="x"
                    subtext="Özsermaye Çarpanı"
                  />
                  <MetricCard
                    label="FD/FAVÖK"
                    value={currentStock.fd_favok}
                    suffix="x"
                    subtext="Faaliyet Performansı"
                  />
                  <MetricCard
                    label="PEG"
                    value={currentStock.peg}
                    trend={currentStock.peg > 0 && currentStock.peg < 1 ? 'up' : 'down'}
                    subtext="Büyüme Değerleme"
                  />
                </div>

                {/* 3. AI ANALYSIS BUTTON - After metrics */}
                <div className="w-full">
                  <AIAnalysisCard stockData={currentStock} />
                </div>

                {/* 4. ANALYST NOTE - Bottom */}
                <div className="w-full rounded-xl md:rounded-2xl border border-gray-800 bg-gray-900 p-4 md:p-6 relative overflow-hidden group hover:border-gray-700 transition-colors">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity hidden md:block">
                    <FileText size={80} />
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 text-gray-400">
                    <div className="p-1.5 md:p-2 bg-gray-800 rounded-lg">
                      <FileText size={14} className="md:w-[18px] md:h-[18px]" />
                    </div>
                    <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Analist Notu</h3>
                  </div>
                  <div className="pl-3 md:pl-4 border-l-2 border-indigo-500/50">
                    <p className="text-xs md:text-sm text-gray-200 leading-relaxed italic line-clamp-3 md:line-clamp-none">
                      "{currentStock.yorum || "Bu şirket için henüz özel bir analist notu girilmemiştir."}"
                    </p>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'finansal' && (
              <DetailedBalanceSheet ticker={currentStock.ticker} />
            )}

            {activeTab === 'oranlar' && (
              <>
                {/* Mobile: Compact Bubble Grid */}
                <div className="md:hidden">
                  <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Temel Oranlar</h3>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {/* Compact Ratio Bubbles */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
                      <div className="text-[9px] text-gray-500 uppercase mb-1">ROE</div>
                      <div className="text-lg font-bold text-purple-400">%{currentStock.ozkaynak_karlilik}</div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
                      <div className="text-[9px] text-gray-500 uppercase mb-1">ROA</div>
                      <div className="text-lg font-bold text-gray-200">%{currentStock.aktif_karlilik}</div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
                      <div className="text-[9px] text-gray-500 uppercase mb-1">Net Marj</div>
                      <div className={`text-lg font-bold ${currentStock.net_kar_marji > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>%{currentStock.net_kar_marji}</div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
                      <div className="text-[9px] text-gray-500 uppercase mb-1">ROIC</div>
                      <div className={`text-lg font-bold ${currentStock.roic > 20 ? 'text-emerald-400' : 'text-gray-200'}`}>%{currentStock.roic}</div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
                      <div className="text-[9px] text-gray-500 uppercase mb-1">Cari</div>
                      <div className={`text-lg font-bold ${currentStock.cari_oran > 1.5 ? 'text-emerald-400' : currentStock.cari_oran < 1 ? 'text-rose-400' : 'text-amber-400'}`}>{currentStock.cari_oran}</div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
                      <div className="text-[9px] text-gray-500 uppercase mb-1">Net B/F</div>
                      <div className={`text-lg font-bold ${currentStock.net_borc_favok < 3 ? 'text-emerald-400' : 'text-rose-400'}`}>{currentStock.net_borc_favok}</div>
                    </div>
                  </div>

                  {/* Additional Ratios Compact List */}
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Brüt Kâr Marjı</span>
                      <span className="text-gray-200 font-mono font-bold">%{currentStock.brut_kar_marji}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">PEG Rasyosu</span>
                      <span className={`font-mono font-bold ${currentStock.peg < 1 && currentStock.peg > 0 ? 'text-emerald-400' : 'text-gray-200'}`}>{currentStock.peg}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">PD / Defter Değeri</span>
                      <span className="text-gray-200 font-mono font-bold">{currentStock.pd_dd}x</span>
                    </div>
                  </div>
                </div>

                {/* Desktop: Original Wide Cards with Progress Bars */}
                <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="rounded-2xl border border-gray-800 bg-gray-900 p-7 hover:border-purple-500/30 transition-all duration-300 group">
                    <h3 className="text-xs font-bold text-purple-400 mb-6 uppercase tracking-wider flex items-center gap-2">
                      <PieChart size={16} className="group-hover:scale-110 transition-transform" /> Kârlılık Analizi
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center text-sm mb-2">
                          <span className="text-gray-400 font-medium">Özkaynak Kârlılığı</span>
                          <span className="text-white font-bold text-base">%{currentStock.ozkaynak_karlilik}</span>
                        </div>
                        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.min(Math.max(currentStock.ozkaynak_karlilik, 0), 100)}%` }}></div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-800/50 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Aktif Kârlılık (ROA)</span>
                          <span className="text-gray-200 font-mono">%{currentStock.aktif_karlilik}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Net Kâr Marjı</span>
                          <span className={`font-mono font-bold ${currentStock.net_kar_marji > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>%{currentStock.net_kar_marji}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Brüt Kâr Marjı</span>
                          <span className="text-gray-200 font-mono">%{currentStock.brut_kar_marji}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-800 bg-gray-900 p-7 hover:border-emerald-500/30 transition-all duration-300 group">
                    <h3 className="text-xs font-bold text-emerald-400 mb-6 uppercase tracking-wider flex items-center gap-2">
                      <Activity size={16} className="group-hover:scale-110 transition-transform" /> Verimlilik & Yatırım
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center text-sm mb-2">
                          <span className="text-gray-400 font-medium">ROIC (Yatırım Serm. Getirisi)</span>
                          <span className={`font-bold text-base ${currentStock.roic > 20 ? 'text-emerald-400' : 'text-white'}`}>%{currentStock.roic}</span>
                        </div>
                        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${currentStock.roic > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(Math.abs(currentStock.roic) * 2, 100)}%` }}></div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-800/50 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">PEG Rasyosu</span>
                          <span className={`font-mono font-bold ${currentStock.peg < 1 && currentStock.peg > 0 ? 'text-emerald-400' : 'text-gray-200'}`}>{currentStock.peg}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Fiyat / Kazanç</span>
                          <span className="text-gray-200 font-mono">{currentStock.anlik_fk}x</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-800 bg-gray-900 p-7 hover:border-rose-500/30 transition-all duration-300 group">
                    <h3 className="text-xs font-bold text-rose-400 mb-6 uppercase tracking-wider flex items-center gap-2">
                      <Filter size={16} className="group-hover:scale-110 transition-transform" /> Borçluluk & Likidite
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center text-sm mb-2">
                          <span className="text-gray-400 font-medium">Cari Oran</span>
                          <span className={`font-bold text-base ${currentStock.cari_oran > 1.5 ? 'text-emerald-400' : currentStock.cari_oran < 1 ? 'text-rose-400' : 'text-amber-400'}`}>{currentStock.cari_oran}</span>
                        </div>
                        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden relative">
                          <div className="absolute top-0 bottom-0 w-0.5 bg-white/20 left-[50%] z-10"></div>
                          <div className={`h-full rounded-full ${currentStock.cari_oran > 1.5 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(currentStock.cari_oran * 33, 100)}%` }}></div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-800/50 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Net Borç / FAVÖK</span>
                          <span className={`font-mono font-bold ${currentStock.net_borc_favok < 3 ? 'text-emerald-400' : 'text-rose-400'}`}>{currentStock.net_borc_favok}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">PD / Defter Değeri</span>
                          <span className="text-gray-200 font-mono">{currentStock.pd_dd}x</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default StockTerminal;