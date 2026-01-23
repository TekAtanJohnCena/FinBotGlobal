import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from "../lib/api";
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    BarChart2,
    Calendar,
    Coins,
    Download,
    Activity,
    Info
} from 'lucide-react';

const Financials = () => {
    const { symbol } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("Gelir Tablosu");

    useEffect(() => {
        const fetchFinancials = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/stock-analysis/${symbol}`);
                if (response.data.ok) {
                    // Sort history by date ascending for table columns (Oldest -> Newest)
                    const sortedHistory = (response.data.data.financials.history || []).sort((a, b) =>
                        new Date(a.date) - new Date(b.date)
                    );
                    setData({ ...response.data.data, financials: { ...response.data.data.financials, history: sortedHistory } });
                } else {
                    setError("Veriler yüklenemedi.");
                }
            } catch (err) {
                setError("Sunucu hatası.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (symbol) fetchFinancials();
    }, [symbol]);

    const formatValue = (val) => {
        if (val === undefined || val === null) return "-";
        const num = Number(val);
        const formatted = Math.abs(num).toLocaleString('tr-TR', { maximumFractionDigits: 0 });
        return num < 0 ? `(${formatted})` : formatted;
    };

    const getRows = () => {
        if (activeTab === "Gelir Tablosu") {
            return [
                { label: "Satış Gelirleri", key: "revenue" },
                { label: "Satışların Maliyeti (-)", key: "costOfRevenue", negative: true },
                { label: "Brüt Kâr", key: "grossProfit", bold: true },
                { label: "Faaliyet Giderleri (-)", key: "opExpenses", negative: true },
                { label: "FAVÖK (EBITDA)", key: "ebitda", bold: true },
                { label: "Net Dönem Kârı", key: "netIncome", bold: true, highlight: true },
            ];
        } else if (activeTab === "Bilanço") {
            return [
                { label: "Nakit ve Benzerleri", key: "cashAndEquivalents" },
                { label: "Toplam Varlıklar", key: "totalAssets", bold: true },
                { label: "Uzun Vadeli Borçlar", key: "longTermDebt", negative: true },
                { label: "Toplam Yükümlülükler", key: "totalLiabilities", bold: true },
                { label: "Özkaynaklar", key: "totalEquity", bold: true, highlight: true },
            ];
        } else {
            return [
                { label: "İşletme Faaliyetleri Nakit Akışı", key: "netCashProvidedByOperatingActivities" },
                { label: "Yatırım Faaliyetleri Nakit Akışı", key: "netCashUsedForInvestingActivities" },
                { label: "Finansman Faaliyetleri Nakit Akışı", key: "netCashUsedProvidedByFinancingActivities" },
                { label: "Net Nakit Değişimi", key: "netChangeInCash", bold: true, highlight: true },
            ];
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0f111a] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-xs">Mali Tablolar Hazırlanıyor...</p>
            </div>
        </div>
    );

    const history = data?.financials?.history || [];
    const rows = getRows();

    return (
        <div className="min-h-screen bg-[#0f111a] text-white font-sans selection:bg-indigo-500/30">
            {/* HEADER */}
            <div className="border-b border-slate-800 bg-[#0f111a]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <button
                            onClick={() => navigate(`/screener/${symbol}`)}
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group px-3 py-2 rounded-xl hover:bg-slate-800"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="font-bold text-sm">Geri Dön</span>
                        </button>
                        <div className="h-8 w-[1px] bg-slate-800 mx-2"></div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black tracking-tighter">{symbol} Finansal Raporu</h1>
                                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-black rounded uppercase border border-indigo-500/20">Audit Ready</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xl font-mono font-bold text-indigo-400">${data?.price?.toFixed(2)}</span>
                                <span className={`text-xs font-bold ${data?.changePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {data?.changePercent >= 0 ? '+' : ''}{data?.changePercent?.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* FUNDAMENTAL QUICK STATS */}
                    <div className="hidden xl:flex items-center gap-10">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Piyasa Değeri</span>
                            <span className="text-sm font-black text-slate-200">{data?.fundamentals?.marketCap ? (data.fundamentals.marketCap >= 1e12 ? (data.fundamentals.marketCap / 1e12).toFixed(2) + "T" : (data.fundamentals.marketCap / 1e9).toFixed(2) + "B") : "—"}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">F/K Oranı</span>
                            <span className="text-sm font-black text-slate-200">{data?.fundamentals?.peRatio?.toFixed(2) || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">T. Verimi</span>
                            <span className="text-sm font-black text-emerald-400">{data?.fundamentals?.dividendYield ? `%${(data.fundamentals.dividendYield * 100).toFixed(2)}` : "—"}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ROE / Beta</span>
                            <span className="text-sm font-black text-slate-200">
                                {data?.fundamentals?.roe ? `%${(data.fundamentals.roe * 100).toFixed(1)}` : "—"}
                                <span className="text-slate-600 mx-1">/</span>
                                <span className="text-indigo-400">{data?.fundamentals?.beta?.toFixed(2) || "—"}</span>
                            </span>
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-slate-500 uppercase">Para Birimi</span>
                            <span className="text-sm font-bold flex items-center gap-1 text-slate-200">
                                <Coins size={14} className="text-amber-500" /> USD
                            </span>
                        </div>
                        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 font-bold text-sm">
                            <Download size={18} /> Excel İndir
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto p-8">
                {/* TAB CONTROLS */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex p-1.5 bg-[#1e222d] border border-slate-800 rounded-2xl shadow-inner">
                        {["Gelir Tablosu", "Bilanço", "Nakit Akışı"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-8 py-3 rounded-xl font-black text-sm transition-all ${activeTab === tab
                                    ? 'bg-[#0f111a] text-white shadow-xl border border-slate-700'
                                    : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                        <Info size={14} className="text-indigo-400" />
                        <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Yıllık Veriler (Audit Result)</span>
                    </div>
                </div>

                {/* PIVOT TABLE */}
                <div className="bg-[#1e222d] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#2a2e39] border-b border-slate-700">
                                    <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-slate-400 sticky left-0 bg-[#2a2e39] z-20 min-w-[300px]">
                                        Kalemler (USD)
                                    </th>
                                    {history.map((stmt) => (
                                        <th key={stmt.date} className="px-8 py-6 text-center text-sm font-black text-slate-300 min-w-[150px]">
                                            {new Date(stmt.date).getFullYear()}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {rows.map((row, idx) => (
                                    <tr
                                        key={row.key}
                                        className={`group transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[#0f111a]/30'} hover:bg-indigo-500/5`}
                                    >
                                        <td className={`px-8 py-5 text-sm sticky left-0 z-10 font-bold transition-colors ${row.highlight ? 'text-indigo-400' : 'text-slate-300 group-hover:text-white'
                                            } ${idx % 2 === 0 ? 'bg-[#1e222d]' : 'bg-[#141822]'} group-hover:bg-indigo-950/20`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1.5 h-1.5 rounded-full ${row.bold ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
                                                {row.label}
                                            </div>
                                        </td>
                                        {history.map((stmt) => {
                                            const val = stmt[row.key];
                                            const isNeg = val < 0;
                                            return (
                                                <td
                                                    key={stmt.date}
                                                    className={`px-8 py-5 text-right font-mono text-sm font-medium ${row.bold ? 'text-slate-100 font-bold' : 'text-slate-400'
                                                        } ${isNeg ? 'text-rose-400' : ''}`}
                                                >
                                                    {formatValue(val)}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* FOOTER NOTE */}
                <div className="mt-8 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-[#1e222d] p-6 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-4">
                        <span>© 2026 FinBot Global Markets</span>
                        <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                        <span>Kaynak: Tiingo Financials</span>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-400">
                        <Activity size={14} />
                        <span>Gerçek Zamanlı Veri İşleme Devrede</span>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Financials;
