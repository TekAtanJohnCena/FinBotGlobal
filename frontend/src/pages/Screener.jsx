import React, { useState, useEffect, useMemo } from 'react';
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
  ArrowDownRight,
  Newspaper,
  BookOpen,
  PenTool,
  Trash2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
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

  // Chart & Analysis State
  const [historyData, setHistoryData] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [activeRange, setActiveRange] = useState("1 Ay");
  const [periodPerformances, setPeriodPerformances] = useState({});
  const [chartType, setChartType] = useState('area');

  // Trendline Tool State (Hybrid: Series for Line, Annotations for Markers)
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null); // { x, y }
  const [trendLines, setTrendLines] = useState([]); // Series for lines
  const [annotations, setAnnotations] = useState({ xaxis: [], points: [] });

  // Prepare Series Data (Filtered & Mapped)
  const series = useMemo(() => {
    if (!historyData || historyData.length === 0) return [];

    // 1. Client-Side Filtering based on Active Range (Fix Sorun 1)
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

    // Fallback: If no match, show all (backend handles specific API calls anyway)
    // But slicing guarantees visual update if backend data is accumulating
    const limit = ranges[activeRange] || historyData.length;
    const filteredData = historyData.slice(-limit);

    // 2. Mapping
    const seriesData = filteredData
      .filter(item => item && item.date)
      .map(item => {
        const dateStr = item.date;
        const timestamp = new Date(dateStr).getTime();

        // Strict Check
        if (isNaN(timestamp)) return null;

        // Robust Value Extraction
        const c = parseFloat(item.price || item.close || item.adjClose || 0);
        // Fallbacks for OHLC
        const o = parseFloat(item.open || item.adjOpen || c);
        const h = parseFloat(item.high || item.adjHigh || c);
        const l = parseFloat(item.low || item.adjLow || c);

        // Ensure no NaNs
        if (isNaN(c)) return null;

        if (chartType === 'candlestick') {
          return { x: timestamp, y: [o, h, l, c] };
        } else {
          return { x: timestamp, y: c };
        }
      })
      .filter(item => item !== null)
      .sort((a, b) => a.x - b.x);

    return [{ name: 'Fiyat', data: seriesData }];
  }, [historyData, chartType, activeRange]); // Added activeRange dependency

  // ApexCharts Options (Fixed Dark Mode & TradingView Colors)
  const isCandle = chartType === 'candlestick';
  const chartOptions = {
    chart: {
      type: chartType,
      height: 350,
      toolbar: { show: true, tools: { download: false, selection: true, zoom: true, pan: true } },
      background: 'transparent', // Always Transparent (Sorun 2)
      animations: { enabled: true },
      foreColor: isCandle ? '#333' : '#cbd5e1', // Always Light Text
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
    annotations: annotations, // Pass Dynamic Annotations (Fix Sorun)
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 2, // Default width
      colors: undefined // Dynamic arrays handled by ApexCharts default or series specific
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
        formatter: (val) => `$${val.toFixed(2)}`
      },
      tooltip: { enabled: true }
    },
    theme: { mode: 'dark' }, // Always Dark (Sorun 2)
    grid: {
      show: true,
      borderColor: '#2B2B43', // Dark Grid
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } }
    },
    fill: {
      type: chartType === 'area' ? 'gradient' : 'solid',
      gradient: { shadeIntensity: 1, opacityFrom: 0.5, opacityTo: 0.1, stops: [0, 90, 100] }
    },
    tooltip: {
      theme: 'dark', // Always Dark Tooltip
      style: { fontSize: '12px' },
      x: { format: 'dd MMM yyyy' },
      y: { formatter: (val) => `$${val.toFixed(2)}` }
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

  const fetchStockAnalysis = async (targetSymbol) => {
    setAnalysisLoading(true);
    try {
      const response = await api.get(`/stock-analysis/${targetSymbol}`);
      if (response.data.ok) {
        const data = response.data.data;
        setAnalysisData(data);
        setHistoryData(data.history || []);
        calculateAllPeriodChanges(data.history || []);
      }
    } catch (err) {
      console.error("Analysis fetch error:", err);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const calculateAllPeriodChanges = (history) => {
    if (!history || history.length < 2) return;

    const lastPrice = history[history.length - 1].price;
    const ranges = {
      "Gün içi": 2,
      "1 Hafta": 7,
      "1 Ay": 30,
      "3 Ay": 90,
      "6 Ay": 180,
      "1 Yıl": 365
    };

    const perfs = {};
    Object.entries(ranges).forEach(([label, days]) => {
      const index = Math.max(0, history.length - days);
      const startPrice = history[index].price;
      perfs[label] = ((lastPrice / startPrice) - 1) * 100;
    });

    setPeriodPerformances(perfs);
  };

  const getFilteredData = () => {
    if (!historyData.length) return [];
    const ranges = {
      "Gün içi": 2,
      "1 Hafta": 7,
      "1 Ay": 30,
      "3 Ay": 90,
      "6 Ay": 180,
      "1 Yıl": 365
    };
    const days = ranges[activeRange] || historyData.length;
    return historyData.slice(-days).map(item => ({
      ...item,
      dateFormatted: new Date(item.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })
    }));
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (symbol) {
      fetchStockAnalysis(symbol);
    }
  }, [symbol]);

  const formatMoney = (value) => {
    if (!value) return "-";
    if (value >= 1e12) return (value / 1e12).toFixed(1) + "T";
    if (value >= 1e9) return (value / 1e9).toFixed(1) + "B";
    if (value >= 1e6) return (value / 1e6).toFixed(1) + "M";
    return value.toLocaleString();
  };

  const filteredStocks = stocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#0a0f1c] text-white overflow-hidden font-sans">
      {/* LEFT SIDEBAR: STOCK LIST */}
      <div className="w-80 md:w-1/4 flex-shrink-0 bg-[#1e222d] border-r border-slate-800 flex flex-col">
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
                  onClick={() => navigate(`/screener/${stock.symbol}`)}
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
          <div className="p-6 space-y-8 animate-in fade-in duration-700">
            {/* TOP HEADER INFO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-[#1e222d] border border-slate-800 rounded-2xl shadow-xl">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-500/20">
                  {symbol.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-4xl font-black tracking-tighter">{symbol}</h2>
                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-black rounded-lg border border-indigo-500/20 uppercase">Stock</span>
                  </div>
                  <p className="text-slate-400 text-sm font-medium mt-1">{analysisData?.name || 'Company Name'}</p>
                </div>
              </div>

              <div className="mt-4 md:mt-0 text-right">
                <div className="text-4xl font-mono font-black text-white">${analysisData?.price?.toFixed(2) || '0.00'}</div>
                <div className={`text-sm font-bold flex items-center justify-end gap-1 mt-1 ${analysisData?.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {analysisData?.changePercent >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {analysisData?.changePercent?.toFixed(2)}% Bugün
                </div>
              </div>
            </div>

            {/* 1. CHART SECTION (h-[400px]) */}
            <div className="bg-[#1e222d] border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <Activity className="text-indigo-400 w-5 h-5" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Teknik Analiz Görünümü</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                  {/* Chart Type Toggle */}
                  <div className="flex gap-1 p-1 bg-[#131722] rounded-xl border border-slate-800 shadow-inner">
                    <button
                      onClick={() => setChartType('area')}
                      className={`p-2 rounded-lg transition-all ${chartType === 'area' ? 'bg-[#1e222d] text-indigo-400 border border-slate-700 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                      title="Alan Grafiği"
                    >
                      <TrendingUp size={16} />
                    </button>
                    <button
                      onClick={() => setChartType('candlestick')}
                      className={`p-2 rounded-lg transition-all ${chartType === 'candlestick' ? 'bg-[#1e222d] text-indigo-400 border border-slate-700 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                      title="Mum Grafiği"
                    >
                      <BarChart2 size={16} />
                    </button>
                  </div>

                  {/* Drawing Tools (NEW) */}
                  <div className="flex gap-1 p-1 bg-[#131722] rounded-xl border border-slate-800 shadow-inner">
                    <button
                      onClick={() => {
                        setIsDrawing(!isDrawing);
                        setDrawStart(null); // Reset partial line
                      }}
                      className={`p-2 rounded-lg transition-all ${isDrawing ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                      title={isDrawing ? "Çizimi İptal Et" : "Trend Çizgisi Çek"}
                    >
                      <PenTool size={16} />
                    </button>
                    {(trendLines.length > 0 || annotations.points.length > 0) && (
                      <button
                        onClick={() => {
                          setTrendLines([]);
                          setAnnotations({ xaxis: [], points: [] });
                        }}
                        className="p-2 rounded-lg transition-all text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 border border-transparent"
                        title="Çizgileri Temizle"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="hidden sm:block w-px h-8 bg-slate-800 mx-1"></div>

                  {/* Range Buttons */}
                  <div className="flex flex-wrap gap-1 p-1 bg-[#131722] rounded-xl border border-slate-800 shadow-inner">
                    {["Gün içi", "1 Hafta", "1 Ay", "3 Ay", "6 Ay", "1 Yıl"].map((range) => {
                      const perf = periodPerformances[range] || 0;
                      const isActive = activeRange === range;
                      return (
                        <button
                          key={range}
                          onClick={() => setActiveRange(range)}
                          className={`flex flex-col items-center px-4 py-1.5 rounded-lg transition-all min-w-[70px] ${isActive ? 'bg-[#1e222d] border border-slate-700 shadow-xl text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          <span className="text-[10px] font-black uppercase">{range}</span>
                          <span className={`text-[11px] font-bold ${perf >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {perf >= 0 ? '+' : ''}{perf.toFixed(1)}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="h-[400px] w-full relative">
                {analysisLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1e222d]/80 z-20 backdrop-blur-sm rounded-xl">
                    <RefreshCw className="w-10 h-10 animate-spin text-indigo-500" />
                  </div>
                ) : (
                  <ReactApexChart
                    key={chartType + (symbol || '') + trendLines.length}
                    options={chartOptions}
                    series={[...series, ...trendLines]}
                    type={chartType}
                    height="100%"
                    width="100%"
                  />
                )}
              </div>
            </div>

            {/* 2. COMPANY PROFILE (Description) */}
            {analysisData?.fundamentals?.description && (
              <div className="bg-[#131722] p-6 rounded-2xl border border-slate-800/50 shadow-inner">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                  <BookOpen size={14} className="text-indigo-400" /> Şirket Hakkında
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed font-medium">{analysisData.fundamentals.description}</p>
              </div>
            )}

            {/* 3. SUMMARY FINANCIALS */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* FUNDAMENTALS */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <PieChart size={14} className="text-indigo-400" /> Temel Veriler
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1e222d] p-4 rounded-2xl border border-slate-800 shadow-lg">
                    <div className="text-[10px] font-black text-slate-500 uppercase mb-1">Piyasa Değeri</div>
                    <div className="text-lg font-mono font-black text-slate-100">{analysisData?.fundamentals?.marketCap ? formatMoney(analysisData.fundamentals.marketCap) : '—'}</div>
                  </div>
                  <div className="bg-[#1e222d] p-4 rounded-2xl border border-slate-800 shadow-lg">
                    <div className="text-[10px] font-black text-slate-500 uppercase mb-1">F/K Oranı</div>
                    <div className="text-lg font-mono font-black text-slate-100">{analysisData?.fundamentals?.peRatio ? analysisData.fundamentals.peRatio.toFixed(2) : '—'}</div>
                  </div>
                  <div className="bg-[#1e222d] p-4 rounded-2xl border border-slate-800 shadow-lg">
                    <div className="text-[10px] font-black text-slate-500 uppercase mb-1">Temettü Verimi</div>
                    <div className="text-lg font-mono font-black text-slate-100">{analysisData?.fundamentals?.dividendYield ? `%${(analysisData.fundamentals.dividendYield * 100).toFixed(2)}` : '—'}</div>
                  </div>
                  <div className="bg-[#1e222d] p-4 rounded-2xl border border-slate-800 shadow-lg">
                    <div className="text-[10px] font-black text-slate-500 uppercase mb-1">Beta / ROE</div>
                    <div className="text-lg font-mono font-black text-slate-100">
                      {analysisData?.fundamentals?.beta ? analysisData.fundamentals.beta.toFixed(2) : '—'}
                      <span className="text-slate-600 mx-1">/</span>
                      <span className="text-indigo-400">{analysisData?.fundamentals?.roe ? `%${(analysisData.fundamentals.roe * 100).toFixed(1)}` : '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* FINANCIALS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <DollarSign size={14} className="text-indigo-400" /> Mali Performans (Yıllık)
                  </h3>
                  <Link
                    to={`/financials/${symbol}`}
                    className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase flex items-center gap-1 group"
                  >
                    Detaylı Tablolar
                    <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1e222d] p-4 rounded-2xl border border-slate-800 shadow-lg flex flex-col justify-center h-[104px]">
                    <div className="text-[10px] font-black text-slate-500 uppercase mb-1 text-indigo-400">Toplam Gelir</div>
                    <div className="text-2xl font-mono font-black text-white">{analysisData?.financials?.summary?.revenue ? formatMoney(analysisData.financials.summary.revenue) : '—'}</div>
                    <div className="text-[9px] text-slate-500 mt-1 font-bold">Son Bilanço Verisi</div>
                  </div>
                  <div className="bg-[#1e222d] p-4 rounded-2xl border border-slate-800 shadow-lg flex flex-col justify-center h-[104px]">
                    <div className="text-[10px] font-black text-slate-500 uppercase mb-1 text-emerald-400">Net Kâr</div>
                    <div className="text-2xl font-mono font-black text-white">{analysisData?.financials?.summary?.netIncome ? formatMoney(analysisData.financials.summary.netIncome) : '—'}</div>
                    <div className={`text-[9px] font-bold mt-1 ${analysisData?.financials?.summary?.netIncome > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      Kârlılık Ratio: %{analysisData?.financials?.summary?.revenue ? ((analysisData.financials.summary.netIncome / analysisData.financials.summary.revenue) * 100).toFixed(1) : '0'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. NEWS SECTION (Bottom) */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Newspaper size={14} className="text-indigo-400" /> Son Haberler: {symbol}
              </h3>
              <div className="space-y-3">
                {analysisData?.news?.length > 0 ? (
                  analysisData.news.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-[#1e222d] border border-slate-800 rounded-xl hover:bg-slate-800 transition-all group"
                    >
                      <div className="flex-1">
                        <div className="text-xs font-black text-indigo-400 mb-1">{item.source} • {new Date(item.date).toLocaleDateString('tr-TR')}</div>
                        <h4 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors line-clamp-1">{item.title}</h4>
                      </div>
                      <ArrowUpRight className="text-slate-600 group-hover:text-indigo-400 transition-colors ml-4 shrink-0" size={18} />
                    </a>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
                    Bu hisse için yakın zamanda haber bulunamadı.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-40">
            <div className="w-32 h-32 bg-[#131722] rounded-[40px] shadow-2xl flex items-center justify-center mb-8 border border-slate-800">
              <BarChart2 size={64} className="text-indigo-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
            </div>
            <h2 className="text-4xl font-black tracking-tighter mb-4">Analiz Dashboard</h2>
            <p className="text-slate-500 max-w-sm font-medium leading-relaxed">Sol panelden bir şirket seçerek devasa teknik grafikleri, mali tabloları ve son haberleri anlık olarak görüntüleyin.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Screener;