import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from "../lib/api";
import {
  Search,
  BarChart2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Activity,
  ArrowUpRight,
  Newspaper,
  BookOpen,
  PenTool,
  Trash2,
  X
} from 'lucide-react';
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import ReactApexChart from 'react-apexcharts';

const Screener = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Chart & Analysis State
  const [historyData, setHistoryData] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [activeRange, setActiveRange] = useState("1 Ay");
  const [periodPerformances, setPeriodPerformances] = useState({});
  const [chartType, setChartType] = useState('area');
  const [language, setLanguage] = useState('en'); // Language for company description

  // Trendline Tool State (Hybrid: Series for Line, Annotations for Markers)
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null); // { x, y }
  const [trendLines, setTrendLines] = useState([]); // Series for lines
  const [annotations, setAnnotations] = useState({ xaxis: [], points: [] });

  // Prepare Series Data (Filtered & Mapped)
  const series = useMemo(() => {
    if (!historyData || historyData.length === 0) return [];

    // 1. Client-Side Filtering based on Active Range (simple slice)
    const ranges = {
      "Gün içi": 2,
      "1 Hafta": 7,
      "1 Ay": 30,
      "3 Ay": 90,
      "6 Ay": 180,
      "1 Yıl": 365,
      "3 Yıl": 365 * 3,
      "5 Yıl": 365 * 5,
      "Tümü": historyData.length
    };

    const limit = ranges[activeRange] || historyData.length;
    let filteredData = historyData.slice(-limit);

    // 2. Downsampling for Performance (max 500 points)
    const MAX_POINTS = 500;
    if (filteredData.length > MAX_POINTS) {
      const step = Math.ceil(filteredData.length / MAX_POINTS);
      const downsampled = [];
      for (let i = 0; i < filteredData.length; i += step) {
        downsampled.push(filteredData[i]);
      }
      // Always include the last point
      if (downsampled[downsampled.length - 1] !== filteredData[filteredData.length - 1]) {
        downsampled.push(filteredData[filteredData.length - 1]);
      }
      filteredData = downsampled;
    }

    // 3. Mapping
    const seriesData = filteredData
      .filter(item => item && item.date)
      .map(item => {
        const timestamp = new Date(item.date).getTime();
        if (isNaN(timestamp)) return null;

        const c = parseFloat(item.price || item.close || item.adjClose || 0);
        const o = parseFloat(item.open || item.adjOpen || c);
        const h = parseFloat(item.high || item.adjHigh || c);
        const l = parseFloat(item.low || item.adjLow || c);

        // Skip null, undefined, or zero values
        if (isNaN(c) || c === null || c === 0) return null;

        if (chartType === 'candlestick') {
          return { x: timestamp, y: [o, h, l, c] };
        } else {
          return { x: timestamp, y: c };
        }
      })
      .filter(item => item !== null)
      .sort((a, b) => a.x - b.x);

    return [{ name: 'Fiyat', data: seriesData }];
  }, [historyData, chartType, activeRange]);

  // ApexCharts Options
  const isCandle = chartType === 'candlestick';
  const chartOptions = {
    chart: {
      type: chartType,
      height: 350,
      toolbar: { show: true, tools: { download: false, selection: true, zoom: true, pan: true } },
      background: 'transparent',
      animations: { enabled: true },
      foreColor: isCandle ? '#333' : '#cbd5e1',
      events: {
        click: function (event, chartContext, config) {
          // Drawing Logic
          if (!isDrawing) return;

          const seriesIndex = config.seriesIndex;
          const dataPointIndex = config.dataPointIndex;

          if (seriesIndex === undefined || dataPointIndex === undefined || seriesIndex < 0 || dataPointIndex < 0) return;

          // Get Coordinates
          const timestamp = config.globals.seriesX[seriesIndex][dataPointIndex];
          let price = config.globals.series[seriesIndex][dataPointIndex];

          // Handle Candlestick Array [o,h,l,c] -> take Close
          if (Array.isArray(price)) {
            price = price[3];
          }

          if (!drawStart) {
            // 1. First Click: Set Start & Add Temporary Marker
            setDrawStart({ x: timestamp, y: price });
            setAnnotations(prev => ({
              ...prev,
              points: [
                ...prev.points,
                {
                  x: timestamp,
                  y: price,
                  marker: {
                    size: 5, fillColor: '#fff', strokeColor: '#FFD700', strokeWidth: 2, radius: 2, cssClass: 'cursor-pointer'
                  }
                }
              ]
            }));
          } else {
            // 2. Second Click: Draw Line Series & Finalize Rings

            const startPoint = {
              x: drawStart.x,
              y: drawStart.y,
              marker: { size: 6, fillColor: 'transparent', strokeColor: '#FFD700', strokeWidth: 3, radius: 2 }
            };

            const endPoint = {
              x: timestamp,
              y: price,
              marker: { size: 6, fillColor: 'transparent', strokeColor: '#FFD700', strokeWidth: 3, radius: 2 }
            };

            // Create new Line Series
            const newTrendLine = {
              name: `Trend Çizgisi ${trendLines.length + 1}`,
              type: 'line',
              data: [
                { x: drawStart.x, y: drawStart.y },
                { x: timestamp, y: price }
              ],
              color: '#FFD700' // Gold Color
            };

            setTrendLines(prev => [...prev, newTrendLine]);

            // Keep Points in Annotations
            setAnnotations(prev => ({
              ...prev,
              points: [...prev.points.slice(0, -1), startPoint, endPoint]
            }));

            setDrawStart(null);
            setIsDrawing(false);
          }
        }
      }
    },
    annotations: annotations,
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 2,
      colors: undefined
    },
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeFormatter: { year: 'yyyy', month: "MMM 'yy", day: 'dd MMM', hour: 'HH:mm' },
        style: { colors: '#94a3b8', fontSize: '11px', fontWeight: 600 }
      },
      tooltip: { enabled: false },
      axisBorder: { show: true, color: '#334155' },
      axisTicks: { show: true, color: '#334155' }
    },
    yaxis: {
      labels: {
        style: { colors: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' },
        formatter: (val) => val != null ? `$${Number(val).toFixed(2)}` : ''
      },
      tooltip: { enabled: true }
    },
    theme: { mode: 'dark' },
    grid: {
      show: true,
      borderColor: '#2B2B43',
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } }
    },
    fill: {
      type: chartType === 'area' ? 'gradient' : 'solid',
      gradient: { shadeIntensity: 1, opacityFrom: 0.5, opacityTo: 0.1, stops: [0, 90, 100] }
    },
    tooltip: {
      theme: 'dark',
      style: { fontSize: '12px' },
      x: { format: 'dd MMM yyyy' },
      y: { formatter: (val) => val != null ? `$${Number(val).toFixed(2)}` : '' }
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#26a69a',   // TradingView Green
          downward: '#ef5350'  // TradingView Red
        },
        wick: { useFillColor: true }
      }
    },
    colors: ['#6366f1']
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/screener-fundamentals');
      if (response.data.ok) {
        setStocks(response.data.data);
      } else {
        setError("Veriler yüklenemedi.");
      }
    } catch (err) {
      setError("Sunucu hatası: Canlı veriler alınamadı.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // React Query Hook for Stock Analysis
  const { data: queryData, isLoading: isQueryLoading } = useQuery({
    queryKey: ['stockAnalysis', symbol, activeRange, language],
    queryFn: async () => {
      if (!symbol) return null;

      const rangeMap = {
        "Gün içi": "1y",
        "1 Hafta": "1m",
        "1 Ay": "1m",
        "3 Ay": "3m",
        "6 Ay": "6m",
        "1 Yıl": "1y",
        "3 Yıl": "3y",
        "5 Yıl": "5y",
        "Tümü": "max"
      };

      const backendRange = rangeMap[activeRange] || "1y";
      console.log(`🚀 Fetching Analysis: ${symbol} | Range: ${activeRange} -> ${backendRange} | Lang: ${language}`);

      const response = await api.get(`/stock-analysis/${symbol}?range=${backendRange}&lang=${language}`);
      if (!response.data.ok) throw new Error("API Error");

      return response.data.data;
    },
    enabled: !!symbol,
    staleTime: 60000,
    placeholderData: keepPreviousData,
  });

  // Calculate Performance Changes
  const calculateAllPeriodChanges = (history) => {
    if (!history || history.length < 2) return;

    const findPriceDaysAgo = (days) => {
      // Safety check for history item structure
      const lastItem = history[history.length - 1];
      if (!lastItem || !lastItem.date) return 0;

      const now = new Date(lastItem.date).getTime();
      const targetTime = now - (days * 24 * 60 * 60 * 1000);

      let closest = history[0];
      let minDiff = Math.abs(new Date(closest.date).getTime() - targetTime);

      for (let i = 0; i < history.length; i++) {
        if (!history[i] || !history[i].date) continue;
        const diff = Math.abs(new Date(history[i].date).getTime() - targetTime);
        if (diff < minDiff) {
          minDiff = diff;
          closest = history[i];
        }
      }
      return closest.price || closest.close;
    };

    const lastItem = history[history.length - 1];
    const lastPrice = lastItem.price || lastItem.close;

    const ranges = {
      "Gün içi": 1,
      "1 Hafta": 7,
      "1 Ay": 30,
      "3 Ay": 90,
      "6 Ay": 180,
      "1 Yıl": 365,
      "5 Yıl": 365 * 5
    };

    const perfs = {};
    Object.entries(ranges).forEach(([label, days]) => {
      let startPrice;
      if (label === "Gün içi") {
        startPrice = lastItem.open || lastItem.price;
      } else {
        startPrice = findPriceDaysAgo(days);
      }
      if (startPrice) {
        perfs[label] = ((lastPrice / startPrice) - 1) * 100;
      }
    });

    const allTimeStart = history[0].price || history[0].close;
    if (allTimeStart) {
      perfs["Tümü"] = ((lastPrice / allTimeStart) - 1) * 100;
    }

    setPeriodPerformances(perfs);
  };

  // Sync Query Data to State & Sanity Check
  useEffect(() => {
    // DEBUG: Log when symbol changes
    console.log('🔍 DEBUG: Current symbol from useParams:', symbol);

    if (queryData) {
      // CRITICAL DEBUG: Full API Response
      console.log(`✅ Data Received for ${symbol} (${activeRange})`, {
        fullResponse: queryData,
        price: queryData.price,
        changePercent: queryData.changePercent,
        historyLength: queryData.history?.length,
        firstItem: queryData.history?.[0],
        lastItem: queryData.history?.at(-1),
        fundamentals: queryData.fundamentals
      });

      // Filter valid history items
      const validHistory = (queryData.history || []).filter(h =>
        h && h.date && !isNaN(new Date(h.date).getTime()) && (h.price !== undefined || h.close !== undefined)
      );

      setAnalysisData(queryData);
      setHistoryData(validHistory);
      calculateAllPeriodChanges(validHistory);

      console.log('📊 DEBUG: analysisData set to:', queryData);
    } else {
      console.log('⚠️ DEBUG: queryData is null/undefined, symbol:', symbol, 'isQueryLoading:', isQueryLoading);
    }
  }, [queryData, symbol, activeRange, isQueryLoading]);

  // Sync Loading State
  useEffect(() => {
    setAnalysisLoading(isQueryLoading);
  }, [isQueryLoading]);

  // Initial Fetch Effect (for Stock List)
  useEffect(() => {
    fetchData();
  }, []);

  const formatMoney = (value) => {
    if (!value) return "-";
    if (value >= 1e12) return (value / 1e12).toFixed(1) + "T";
    if (value >= 1e9) return (value / 1e9).toFixed(1) + "B";
    if (value >= 1e6) return (value / 1e6).toFixed(1) + "M";
    return value.toLocaleString();
  };

  // Recharts için filtrelenmiş veri (eski alan grafiği için)
  const getFilteredData = () => {
    if (!historyData || historyData.length === 0) return [];

    const ranges = {
      "Gün içi": 2,
      "1 Hafta": 7,
      "1 Ay": 30,
      "3 Ay": 90,
      "6 Ay": 180,
      "1 Yıl": 365,
      "3 Yıl": 365 * 3,
      "5 Yıl": 365 * 5,
      "Tümü": historyData.length
    };

    const limit = ranges[activeRange] || historyData.length;
    let filteredData = historyData.slice(-limit);

    // Downsampling for performance (max 200 points for Recharts)
    const MAX_POINTS = 200;
    if (filteredData.length > MAX_POINTS) {
      const step = Math.ceil(filteredData.length / MAX_POINTS);
      const downsampled = [];
      for (let i = 0; i < filteredData.length; i += step) {
        downsampled.push(filteredData[i]);
      }
      if (downsampled[downsampled.length - 1] !== filteredData[filteredData.length - 1]) {
        downsampled.push(filteredData[filteredData.length - 1]);
      }
      filteredData = downsampled;
    }

    return filteredData.map(item => ({
      ...item,
      price: item.price || item.close || item.adjClose,
      dateFormatted: new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
    }));
  };

  const filteredStocks = stocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#0a0f1c] text-white overflow-hidden font-sans">
      {/* Mobile Sidebar Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg transition-all"
      >
        {isSidebarOpen ? <X size={20} /> : <Search size={20} />}
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR: STOCK LIST */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-40
        w-80 lg:w-1/4 flex-shrink-0 
        bg-[#1e222d] border-r border-slate-800 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
              <BarChart2 className="w-6 h-6" />
              Screener
            </h1>
            <button
              onClick={fetchData}
              className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
              title="Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Sembol ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#2a2e39] border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 w-full transition-all text-slate-200"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#131722]">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-10 gap-3 text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-sm font-medium">Yükleniyor...</span>
            </div>
          ) : error ? (
            <div className="p-4 text-xs text-rose-500 text-center">{error}</div>
          ) : (
            <div className="flex flex-col">
              {filteredStocks.map((stock) => (
                <div
                  key={stock.symbol}
                  onClick={() => {
                    navigate(`/screener/${stock.symbol}`);
                    setIsSidebarOpen(false);
                  }}
                  className={`p-4 cursor-pointer border-b border-slate-800/40 transition-all flex items-center justify-between group ${symbol === stock.symbol ? 'bg-indigo-600/10 border-l-4 border-l-indigo-500 shadow-inner' : 'hover:bg-[#1e222d] border-l-4 border-l-transparent'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">{stock.symbol}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-tight font-semibold">Real-time</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-black text-sm text-slate-200">
                      {stock.lastPrice > 0 ? `$${stock.lastPrice.toFixed(2)}` : '—'}
                    </div>
                    <div className={`text-[11px] font-bold flex items-center justify-end gap-1 ${stock.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {stock.lastPrice > 0 ? (
                        <>
                          {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent?.toFixed(2)}%
                        </>
                      ) : (
                        'N/A'
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT CONTENT: ANALYSIS & CHART */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-[#0a0f1c] custom-scrollbar">
        {symbol ? (
          <div className="p-4 md:p-6 space-y-6 md:space-y-8 animate-in fade-in duration-700 mt-14 lg:mt-0">
            {/* TOP HEADER INFO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 md:p-6 bg-[#1e222d] border border-slate-800 rounded-2xl shadow-xl gap-4">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white text-xl md:text-2xl font-black shadow-lg shadow-indigo-500/20">
                  {symbol.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                    <h2 className="text-2xl md:text-4xl font-black tracking-tighter">{symbol}</h2>
                    <span className="px-2 md:px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] md:text-xs font-black rounded-lg border border-indigo-500/20 uppercase">Stock</span>
                  </div>
                  <p className="text-slate-400 text-xs md:text-sm font-medium mt-1">{analysisData?.name || 'Company Name'}</p>
                </div>
              </div>

              <div className="text-left md:text-right w-full md:w-auto">
                <div className="text-2xl md:text-4xl font-mono font-black text-white">${analysisData?.price?.toFixed(2) || '0.00'}</div>
                <div className={`text-xs md:text-sm font-bold flex items-center md:justify-end gap-1 mt-1 ${analysisData?.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {analysisData?.changePercent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {analysisData?.changePercent?.toFixed(2)}% Bugün
                </div>
              </div>
            </div>

            {/* 1. CHART SECTION */}
            <div className="bg-[#1e222d] border border-slate-800 rounded-2xl p-3 md:p-6 shadow-2xl relative">
              <div className="flex flex-col gap-4 mb-4 md:mb-8">
                <div className="flex items-center gap-2">
                  <Activity className="text-indigo-400 w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400">Teknik Analiz Görünümü</span>
                </div>

                <div className="flex flex-wrap gap-2 md:gap-4 items-center">
                  {/* Chart Type Toggle */}
                  <div className="flex gap-1 p-1 bg-[#131722] rounded-xl border border-slate-800 shadow-inner">
                    <button
                      onClick={() => setChartType('area')}
                      className={`p-1.5 md:p-2 rounded-lg transition-all ${chartType === 'area' ? 'bg-[#1e222d] text-indigo-400 border border-slate-700 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                      title="Alan Grafiği"
                    >
                      <TrendingUp size={14} className="md:w-4 md:h-4" />
                    </button>
                    <button
                      onClick={() => setChartType('candlestick')}
                      className={`p-1.5 md:p-2 rounded-lg transition-all ${chartType === 'candlestick' ? 'bg-[#1e222d] text-indigo-400 border border-slate-700 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                      title="Mum Grafiği"
                    >
                      <BarChart2 size={14} className="md:w-4 md:h-4" />
                    </button>
                  </div>

                  {/* Drawing Tools */}
                  <div className="flex gap-1 p-1 bg-[#131722] rounded-xl border border-slate-800 shadow-inner">
                    <button
                      onClick={() => {
                        setIsDrawing(!isDrawing);
                        setDrawStart(null);
                      }}
                      className={`p-1.5 md:p-2 rounded-lg transition-all ${isDrawing ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                      title={isDrawing ? "Çizimi İptal Et" : "Trend Çizgisi Çek"}
                    >
                      <PenTool size={14} className="md:w-4 md:h-4" />
                    </button>
                    {(trendLines.length > 0 || annotations.points.length > 0) && (
                      <button
                        onClick={() => {
                          setTrendLines([]);
                          setAnnotations({ xaxis: [], points: [] });
                        }}
                        className="p-1.5 md:p-2 rounded-lg transition-all text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 border border-transparent"
                        title="Çizgileri Temizle"
                      >
                        <Trash2 size={14} className="md:w-4 md:h-4" />
                      </button>
                    )}
                  </div>

                  {/* Range Buttons - Scrollable on Mobile */}
                  <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <div className="flex gap-1 p-1 bg-[#131722] rounded-xl border border-slate-800 shadow-inner w-fit">
                      {["Gün içi", "1 Hafta", "1 Ay", "3 Ay", "6 Ay", "1 Yıl", "5 Yıl", "Tümü"].map((range) => {
                        const perf = periodPerformances[range] || 0;
                        const isActive = activeRange === range;
                        return (
                          <button
                            key={range}
                            onClick={() => setActiveRange(range)}
                            className={`flex flex-col items-center px-2 md:px-4 py-1 md:py-1.5 rounded-lg transition-all min-w-[50px] md:min-w-[70px] ${isActive ? 'bg-[#1e222d] border border-slate-700 shadow-xl text-white' : 'text-slate-500 hover:text-slate-300'}`}
                          >
                            <span className="text-[8px] md:text-[10px] font-black uppercase whitespace-nowrap">{range}</span>
                            <span className={`text-[9px] md:text-[11px] font-bold ${perf >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {perf >= 0 ? '+' : ''}{perf.toFixed(1)}%
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-[280px] md:h-[400px] w-full relative">
                {analysisLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1e222d]/80 z-20 backdrop-blur-sm rounded-xl">
                    <RefreshCw className="w-10 h-10 animate-spin text-indigo-500" />
                  </div>
                ) : chartType === 'candlestick' ? (
                  /* ApexCharts for Candlestick */
                  <ReactApexChart
                    key={chartType + (symbol || '') + trendLines.length}
                    options={chartOptions}
                    series={[...series, ...trendLines]}
                    type={chartType}
                    height="100%"
                    width="100%"
                  />
                ) : (
                  /* Recharts for Area Chart (Eski Güzel Görünüm) */
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getFilteredData()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={periodPerformances[activeRange] >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={periodPerformances[activeRange] >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                      <XAxis
                        dataKey="dateFormatted"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }}
                        minTickGap={40}
                      />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#131722', border: '1px solid #334155', borderRadius: '12px', fontSize: '13px' }}
                        cursor={{ stroke: '#475569', strokeWidth: 2, strokeDasharray: '4 4' }}
                        formatter={(val) => [`$${val.toFixed(2)}`, 'Fiyat']}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke={periodPerformances[activeRange] >= 0 ? "#22c55e" : "#ef4444"}
                        strokeWidth={3}
                        fill="url(#colorGradient)"
                        animationDuration={1000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* 2. COMPANY PROFILE (Description) */}
            {analysisData?.fundamentals?.description && (
              <div className="bg-[#131722] p-4 md:p-6 rounded-2xl border border-slate-800/50 shadow-inner">
                {/* Header with Language Selector */}
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <BookOpen size={12} className="md:w-[14px] md:h-[14px] text-indigo-400" /> Şirket Hakkında
                  </h3>

                  {/* Language Dropdown */}
                  <div className="relative flex items-center gap-2">
                    {isQueryLoading && (
                      <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                    )}
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="bg-[#1e222d] text-xs text-slate-300 border border-slate-700 rounded-lg px-2 py-1 
                                 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500
                                 cursor-pointer hover:border-indigo-500/50 transition-colors appearance-none pr-6"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236366f1'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 4px center',
                        backgroundSize: '14px'
                      }}
                    >
                      <option value="en">🇬🇧 English</option>
                      <option value="tr">🇹🇷 Türkçe</option>
                      <option value="ar">🇸🇦 العربية</option>
                    </select>
                  </div>
                </div>

                <p className="text-xs md:text-sm text-gray-400 leading-relaxed font-medium">{analysisData.fundamentals.description}</p>
              </div>
            )}

            {/* 3. SUMMARY FINANCIALS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
              {/* FUNDAMENTALS */}
              <div className="space-y-3 md:space-y-4">
                <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <PieChart size={12} className="md:w-[14px] md:h-[14px] text-indigo-400" /> Temel Veriler
                </h3>
                <div className="grid grid-cols-2 gap-2 md:gap-4">
                  <div className="bg-[#1e222d] p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-800 shadow-lg">
                    <div className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase mb-1">Piyasa Değeri</div>
                    <div className="text-sm md:text-lg font-mono font-black text-slate-100">{analysisData?.fundamentals?.marketCap ? formatMoney(analysisData.fundamentals.marketCap) : '—'}</div>
                  </div>
                  <div className="bg-[#1e222d] p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-800 shadow-lg">
                    <div className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase mb-1">F/K Oranı</div>
                    <div className="text-sm md:text-lg font-mono font-black text-slate-100">{analysisData?.fundamentals?.peRatio ? analysisData.fundamentals.peRatio.toFixed(2) : '—'}</div>
                  </div>
                </div>
              </div>

              {/* FINANCIALS */}
              <div className="space-y-3 md:space-y-4">
                <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <DollarSign size={12} className="md:w-[14px] md:h-[14px] text-indigo-400" /> Mali Performans (Yıllık)
                </h3>
                <div className="grid grid-cols-2 gap-2 md:gap-4">
                  <div className="bg-[#1e222d] p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-800 shadow-lg flex flex-col justify-center h-[80px] md:h-[104px]">
                    <div className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase mb-1 text-indigo-400">Toplam Gelir</div>
                    <div className="text-lg md:text-2xl font-mono font-black text-white">{analysisData?.financials?.summary?.revenue ? formatMoney(analysisData.financials.summary.revenue) : '—'}</div>
                    <div className="text-[8px] md:text-[9px] text-slate-500 mt-1 font-bold">Son Bilanço Verisi</div>
                  </div>
                  <div className="bg-[#1e222d] p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-800 shadow-lg flex flex-col justify-center h-[80px] md:h-[104px]">
                    <div className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase mb-1 text-emerald-400">Net Kâr</div>
                    <div className="text-lg md:text-2xl font-mono font-black text-white">{analysisData?.financials?.summary?.netIncome ? formatMoney(analysisData.financials.summary.netIncome) : '—'}</div>
                    <div className={`text-[8px] md:text-[9px] font-bold mt-1 ${analysisData?.financials?.summary?.netIncome > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      Kârlılık Ratio: %{analysisData?.financials?.summary?.revenue ? ((analysisData.financials.summary.netIncome / analysisData.financials.summary.revenue) * 100).toFixed(1) : '0'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detaylı Tablolar Banner - Full Width */}
            <Link
              to={`/financials/${symbol}`}
              className="flex items-center justify-between p-4 md:p-5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 hover:from-indigo-500/20 hover:via-purple-500/20 hover:to-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl md:rounded-2xl transition-all duration-300 group shadow-lg shadow-indigo-500/5 hover:shadow-indigo-500/10"
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                  <BarChart2 size={18} className="md:w-6 md:h-6 text-indigo-400" />
                </div>
                <div>
                  <div className="text-sm md:text-base font-black text-slate-100 group-hover:text-white transition-colors">Detaylı Mali Tablolar</div>
                  <div className="text-[10px] md:text-xs text-slate-500 font-medium">Gelir tablosu, bilanço ve nakit akışı • Yıllık veriler</div>
                </div>
              </div>
              <ArrowUpRight size={20} className="md:w-7 md:h-7 text-indigo-400 group-hover:text-indigo-300 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
            </Link>

            {/* 4. NEWS SECTION (Bottom) */}
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Newspaper size={12} className="md:w-[14px] md:h-[14px] text-indigo-400" /> Son Haberler: {symbol}
              </h3>
              <div className="space-y-2 md:space-y-3">
                {analysisData?.news?.length > 0 ? (
                  analysisData.news.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 md:p-4 bg-[#1e222d] border border-slate-800 rounded-xl hover:bg-slate-800 transition-all group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] md:text-xs font-black text-indigo-400 mb-1">{item.source} • {new Date(item.date).toLocaleDateString('tr-TR')}</div>
                        <h4 className="text-xs md:text-sm font-bold text-slate-200 group-hover:text-white transition-colors line-clamp-2 md:line-clamp-1">{item.title}</h4>
                      </div>
                      <ArrowUpRight className="text-slate-600 group-hover:text-indigo-400 transition-colors ml-3 md:ml-4 shrink-0 w-4 h-4 md:w-[18px] md:h-[18px]" />
                    </a>
                  ))
                ) : (
                  <div className="p-6 md:p-8 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl text-xs md:text-sm">
                    Bu hisse için yakın zamanda haber bulunamadı.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-20 text-center opacity-40 mt-14 lg:mt-0">
            <div className="w-20 h-20 md:w-32 md:h-32 bg-[#131722] rounded-3xl md:rounded-[40px] shadow-2xl flex items-center justify-center mb-6 md:mb-8 border border-slate-800">
              <BarChart2 size={40} className="md:w-16 md:h-16 text-indigo-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
            </div>
            <h2 className="text-2xl md:text-4xl font-black tracking-tighter mb-3 md:mb-4">Analiz Dashboard</h2>
            <p className="text-slate-500 max-w-sm font-medium leading-relaxed text-sm md:text-base">Sol panelden (veya üstteki arama butonundan) bir şirket seçerek teknik grafikleri, mali tabloları ve son haberleri görüntüleyin.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Screener;