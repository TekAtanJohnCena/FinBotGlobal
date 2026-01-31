import React, { useState, useEffect, useMemo } from 'react'; // Re-trigger build
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from "../lib/api";
import {
    TrendingUp,
    TrendingDown,
    BarChart2,
    RefreshCw,
    Maximize2,
    Minimize2,
    PenTool,
    Trash2,
    BookOpen,
    ArrowUpRight,
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

const StockDetailView = ({ symbol, onClose }) => {
    // Chart & Analysis State
    const [historyData, setHistoryData] = useState([]);
    const [analysisData, setAnalysisData] = useState(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [activeRange, setActiveRange] = useState("1 Ay");
    const [periodPerformances, setPeriodPerformances] = useState({});
    const [chartType, setChartType] = useState('area');
    const [language, setLanguage] = useState('en');
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Trendline Tool State
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawStart, setDrawStart] = useState(null);
    const [trendLines, setTrendLines] = useState([]);
    const [annotations, setAnnotations] = useState({ xaxis: [], points: [] });

    // React Query Hook for Stock Analysis
    const { data: queryData, isLoading: isQueryLoading } = useQuery({
        queryKey: ['stockAnalysis', symbol, activeRange, language],
        queryFn: async () => {
            if (!symbol) return null;

            const rangeMap = {
                "Gün içi": "1y", // Fallback to 1y if intraday not available or handled differently
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

    // Sync Query Data
    useEffect(() => {
        if (queryData) {
            const validHistory = (queryData.history || []).filter(h =>
                h && h.date && !isNaN(new Date(h.date).getTime()) && (h.price !== undefined || h.close !== undefined)
            );

            setAnalysisData(queryData);
            setHistoryData(validHistory);
            calculateAllPeriodChanges(validHistory);
        }
    }, [queryData]);

    // Sync Loading
    useEffect(() => {
        setAnalysisLoading(isQueryLoading);
    }, [isQueryLoading]);

    // Format Money
    const formatMoney = (value) => {
        if (!value) return "-";
        if (value >= 1e12) return (value / 1e12).toFixed(1) + "T";
        if (value >= 1e9) return (value / 1e9).toFixed(1) + "B";
        if (value >= 1e6) return (value / 1e6).toFixed(1) + "M";
        return value.toLocaleString();
    };

    // Prepare Series Data
    const series = useMemo(() => {
        if (!historyData || historyData.length === 0) return [];

        const ranges = {
            "Gün içi": 2, "1 Hafta": 7, "1 Ay": 30, "3 Ay": 90,
            "6 Ay": 180, "1 Yıl": 365, "3 Yıl": 365 * 3, "5 Yıl": 365 * 5, "Tümü": historyData.length
        };

        const limit = ranges[activeRange] || historyData.length;
        let filteredData = historyData.slice(-limit);

        // Downsampling
        const MAX_POINTS = 500;
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

        const seriesData = filteredData
            .filter(item => item && item.date)
            .map(item => {
                const timestamp = new Date(item.date).getTime();
                const c = parseFloat(item.price || item.close || item.adjClose || 0);
                const o = parseFloat(item.open || item.adjOpen || c);
                const h = parseFloat(item.high || item.adjHigh || c);
                const l = parseFloat(item.low || item.adjLow || c);

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
                    if (!isDrawing) return;
                    const seriesIndex = config.seriesIndex;
                    const dataPointIndex = config.dataPointIndex;
                    if (seriesIndex === undefined || dataPointIndex === undefined || seriesIndex < 0 || dataPointIndex < 0) return;

                    const timestamp = config.globals.seriesX[seriesIndex][dataPointIndex];
                    let price = config.globals.series[seriesIndex][dataPointIndex];
                    if (Array.isArray(price)) price = price[3];

                    if (!drawStart) {
                        setDrawStart({ x: timestamp, y: price });
                        setAnnotations(prev => ({
                            ...prev,
                            points: [...prev.points, { x: timestamp, y: price, marker: { size: 5, fillColor: '#fff', strokeColor: '#FFD700', strokeWidth: 2, radius: 2 } }]
                        }));
                    } else {
                        const newTrendLine = {
                            name: `Trend Line`,
                            type: 'line',
                            data: [{ x: drawStart.x, y: drawStart.y }, { x: timestamp, y: price }],
                            color: '#FFD700'
                        };
                        setTrendLines(prev => [...prev, newTrendLine]);
                        setDrawStart(null);
                        setIsDrawing(false);
                    }
                }
            }
        },
        annotations: annotations,
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: {
            type: 'datetime',
            labels: { datetimeFormatter: { year: 'yyyy', month: "MMM 'yy", day: 'dd MMM' }, style: { colors: '#94a3b8', fontSize: '11px', fontWeight: 600 } },
            axisBorder: { show: true, color: '#334155' },
            axisTicks: { show: true, color: '#334155' }
        },
        yaxis: {
            labels: { style: { colors: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }, formatter: (val) => val != null ? `$${Number(val).toFixed(2)}` : '' },
            tooltip: { enabled: true }
        },
        theme: { mode: 'dark' },
        grid: { show: true, borderColor: '#2B2B43', strokeDashArray: 4 },
        fill: { type: chartType === 'area' ? 'gradient' : 'solid', gradient: { shadeIntensity: 1, opacityFrom: 0.5, opacityTo: 0.1, stops: [0, 90, 100] } },
        plotOptions: { candlestick: { colors: { upward: '#26a69a', downward: '#ef5350' }, wick: { useFillColor: true } } },
        colors: ['#6366f1']
    };

    const getFilteredDataRecharts = () => {
        if (!historyData || historyData.length === 0) return [];
        // Reuse logic or simplify for Recharts fallback
        const limit = 200; // Simplified limit
        let filtered = historyData.slice(-limit);
        return filtered.map(item => ({
            ...item,
            price: item.price || item.close,
            dateFormatted: new Date(item.date).toLocaleDateString()
        }));
    };

    return (
        <div className="h-full flex flex-col bg-[#0f111a] text-white overflow-y-auto custom-scrollbar">
            {/* HEADER */}
            <div className="p-6 border-b border-slate-800 bg-[#1e222d] sticky top-0 z-30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-500/20">
                            {symbol.slice(0, 1)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">{symbol}</h2>
                            <p className="text-slate-400 text-xs font-medium">{analysisData?.name || 'Loading...'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-2xl font-mono font-black text-white">
                                ${analysisData?.price?.toFixed(2) || '0.00'}
                            </div>
                            <div className={`text-xs font-bold flex items-center justify-end gap-1 ${analysisData?.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {analysisData?.changePercent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {analysisData?.changePercent?.toFixed(2)}%
                            </div>
                        </div>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* CHART SECTION */}
                <div className={`
          bg-[#1e222d] border border-slate-800 rounded-2xl shadow-xl relative transition-all duration-300
          ${isFullScreen ? 'fixed inset-0 z-50 m-0 rounded-none w-screen h-screen p-8 bg-[#0f111a]' : 'p-4'}
        `}>
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1 p-1 bg-[#131722] rounded-xl border border-slate-800">
                                <button onClick={() => setChartType('area')} className={`p-1.5 rounded-lg ${chartType === 'area' ? 'bg-[#1e222d] text-indigo-400' : 'text-slate-500'}`}><TrendingUp size={16} /></button>
                                <button onClick={() => setChartType('candlestick')} className={`p-1.5 rounded-lg ${chartType === 'candlestick' ? 'bg-[#1e222d] text-indigo-400' : 'text-slate-500'}`}><BarChart2 size={16} /></button>
                            </div>
                            <div className="flex gap-1 p-1 bg-[#131722] rounded-xl border border-slate-800">
                                <button onClick={() => { setIsDrawing(!isDrawing); setDrawStart(null); }} className={`p-1.5 rounded-lg ${isDrawing ? 'text-amber-500 bg-amber-500/10' : 'text-slate-500'}`}><PenTool size={16} /></button>
                                {(trendLines.length > 0) && <button onClick={() => { setTrendLines([]); setAnnotations({ xaxis: [], points: [] }); }} className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg"><Trash2 size={16} /></button>}
                            </div>
                        </div>

                        <div className="flex gap-1 bg-[#131722] rounded-xl border border-slate-800 p-1 overflow-x-auto">
                            {["1 Hafta", "1 Ay", "3 Ay", "1 Yıl", "5 Yıl"].map(range => (
                                <button
                                    key={range}
                                    onClick={() => setActiveRange(range)}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${activeRange === range ? 'bg-[#1e222d] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>

                        <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2 hover:bg-slate-700 text-slate-400 rounded-lg">
                            {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </button>
                    </div>

                    <div className={`w-full relative ${isFullScreen ? 'h-[85vh]' : 'h-[350px]'}`}>
                        {analysisLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-[#1e222d]/80 z-20 backdrop-blur-sm rounded-xl">
                                <RefreshCw className="w-10 h-10 animate-spin text-indigo-500" />
                            </div>
                        ) : chartType === 'candlestick' ? (
                            <ReactApexChart options={chartOptions} series={[...series, ...trendLines]} type={chartType} height="100%" width="100%" />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={getFilteredDataRecharts()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={periodPerformances[activeRange] >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0.3} />
                                            <stop offset="95%" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                                    <XAxis dataKey="dateFormatted" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} minTickGap={40} />
                                    <YAxis hide domain={['auto', 'auto']} />
                                    <Tooltip contentStyle={{ backgroundColor: '#131722', border: '1px solid #334155', borderRadius: '12px' }} />
                                    <Area type="monotone" dataKey="price" stroke={periodPerformances[activeRange] >= 0 ? "#22c55e" : "#ef4444"} strokeWidth={3} fill="url(#colorGradient)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* DESCRIPTION */}
                {analysisData?.fundamentals?.description && (
                    <div className="bg-[#1e222d] p-5 rounded-2xl border border-slate-800">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><BookOpen size={14} className="text-indigo-400" /> Şirket Profili</h3>
                            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-[#2a2e39] text-xs text-white border border-slate-700 rounded-lg px-2 py-1 outline-none">
                                <option value="en">English</option>
                                <option value="tr">Türkçe</option>
                            </select>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed font-medium">{analysisData.fundamentals.description}</p>
                    </div>
                )}

                {/* FUNDAMENTALS GRID */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#1e222d] p-4 rounded-2xl border border-slate-800">
                        <div className="text-[10px] font-black uppercase text-slate-500 mb-1">Piyasa Değeri</div>
                        <div className="text-lg font-mono font-black text-white">{analysisData?.fundamentals?.marketCap ? formatMoney(analysisData.fundamentals.marketCap) : '—'}</div>
                    </div>
                    <div className="bg-[#1e222d] p-4 rounded-2xl border border-slate-800">
                        <div className="text-[10px] font-black uppercase text-slate-500 mb-1">F/K Oranı</div>
                        <div className="text-lg font-mono font-black text-white">{analysisData?.fundamentals?.peRatio ? analysisData.fundamentals.peRatio.toFixed(2) : '—'}</div>
                    </div>
                    <div className="bg-[#1e222d] p-4 rounded-2xl border border-slate-800">
                        <div className="text-[10px] font-black uppercase text-slate-500 mb-1">Toplam Gelir</div>
                        <div className="text-lg font-mono font-black text-white">{analysisData?.financials?.summary?.revenue ? formatMoney(analysisData.financials.summary.revenue) : '—'}</div>
                    </div>
                    <div className="bg-[#1e222d] p-4 rounded-2xl border border-slate-800">
                        <div className="text-[10px] font-black uppercase text-slate-500 mb-1">Net Kâr</div>
                        <div className="text-lg font-mono font-black text-emerald-400">{analysisData?.financials?.summary?.netIncome ? formatMoney(analysisData.financials.summary.netIncome) : '—'}</div>
                    </div>
                </div>

                {/* FINANCIALS LINK */}
                <Link to={`/financials/${symbol}`} className="block p-4 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 rounded-2xl hover:border-indigo-500/40 transition-all group">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                                <BarChart2 size={20} className="text-indigo-400" />
                            </div>
                            <div>
                                <div className="font-bold text-white group-hover:text-indigo-300 transition-colors">Detaylı Mali Tablolar</div>
                                <div className="text-xs text-slate-500">Gelir Tablosu, Bilanço, Nakit Akışı</div>
                            </div>
                        </div>
                        <ArrowUpRight className="text-indigo-500" />
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default StockDetailView;
