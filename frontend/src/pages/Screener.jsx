import React, { useState, useEffect } from 'react';
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
  BookOpen
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

              <div className="h-[400px] w-full relative">
                {analysisLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1e222d]/80 z-20 backdrop-blur-sm rounded-xl">
                    <RefreshCw className="w-10 h-10 animate-spin text-indigo-500" />
                  </div>
                ) : (
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