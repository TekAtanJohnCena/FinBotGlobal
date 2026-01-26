import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from "../lib/api";
import {
    ArrowLeft,
    Coins,
    Download,
    Activity,
    Info,
    ChevronRight
} from 'lucide-react';

const Financials = () => {
    const { symbol } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("Income Statement");

    useEffect(() => {
        const fetchFinancials = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/stock-analysis/${symbol}`);
                if (response.data.ok) {
                    // Sort history by date DESCENDING (Newest -> Oldest) for the table
                    const sortedHistory = (response.data.data.financials.history || []).sort((a, b) =>
                        new Date(b.date) - new Date(a.date)
                    );
                    setData({ ...response.data.data, financials: { ...response.data.data.financials, history: sortedHistory } });
                } else {
                    setError("Failed to load financial data.");
                }
            } catch (err) {
                setError("Server connection error.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (symbol) fetchFinancials();
    }, [symbol]);

    // Format numbers to B/M (Billions/Millions)
    const formatNumber = (val) => {
        if (val === undefined || val === null || val === 0) return "-";
        const num = Number(val);
        const absNum = Math.abs(num);
        let formatted = "";

        if (absNum >= 1e12) {
            formatted = "$" + (absNum / 1e12).toFixed(2) + "T";
        } else if (absNum >= 1e9) {
            formatted = "$" + (absNum / 1e9).toFixed(2) + "B";
        } else if (absNum >= 1e6) {
            formatted = "$" + (absNum / 1e6).toFixed(1) + "M";
        } else {
            formatted = "$" + absNum.toLocaleString('en-US');
        }

        return num < 0 ? `(${formatted})` : formatted;
    };

    const getRows = () => {
        if (activeTab === "Income Statement") {
            return [
                { label: "Total Revenue", key: "revenue" },
                { label: "Cost of Revenue", key: "costOfRevenue" },
                { label: "Gross Profit", key: "grossProfit", bold: true },
                { label: "Operating Expenses", key: "opExpenses" },
                { label: "EBITDA", key: "ebitda", bold: true },
                { label: "Net Income", key: "netIncome", bold: true, color: "text-emerald-400" },
            ];
        } else if (activeTab === "Balance Sheet") {
            return [
                { label: "Cash & Equivalents", key: "cashAndEquivalents" },
                { label: "Total Assets", key: "totalAssets", bold: true },
                { label: "Total Liabilities", key: "totalLiabilities", bold: true },
                { label: "Long Term Debt", key: "longTermDebt" },
                { label: "Total Equity", key: "totalEquity", bold: true, color: "text-blue-400" },
            ];
        } else {
            return [
                { label: "Operating Cash Flow", key: "netCashProvidedByOperatingActivities" },
                { label: "Investing Cash Flow", key: "netCashUsedForInvestingActivities" },
                { label: "Financing Cash Flow", key: "netCashUsedProvidedByFinancingActivities" },
                { label: "Net Change in Cash", key: "netChangeInCash", bold: true, color: "text-indigo-400" },
            ];
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0f111a] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-[10px]">Assembling Statements...</p>
            </div>
        </div>
    );

    if (error || !data) return (
        <div className="min-h-screen bg-[#0f111a] flex items-center justify-center p-6 text-center">
            <div>
                <h2 className="text-2xl font-black text-rose-500 mb-2">Error</h2>
                <p className="text-slate-400">{error || "No financial data available for this symbol."}</p>
                <button onClick={() => navigate(-1)} className="mt-6 px-6 py-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors font-bold text-sm">Return back</button>
            </div>
        </div>
    );

    const history = data?.financials?.history || [];
    const rows = getRows();

    return (
        <div className="min-h-screen bg-[#0f111a] text-white font-sans selection:bg-indigo-500/30">
            {/* HEADER */}
            <div className="border-b border-slate-800/60 bg-[#0f111a]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-3 md:py-0 md:h-20 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
                    <div className="flex items-center gap-3 md:gap-6">
                        <button
                            onClick={() => navigate(`/screener/${symbol}`)}
                            className="flex items-center gap-1.5 md:gap-2 text-slate-500 hover:text-white transition-all group px-2 md:px-3 py-1.5 md:py-2 rounded-xl hover:bg-slate-800/50"
                        >
                            <ArrowLeft size={16} className="md:w-[18px] md:h-[18px] group-hover:-translate-x-1 transition-transform" />
                            <span className="font-bold text-[10px] md:text-xs uppercase tracking-wider hidden sm:inline">Geri</span>
                        </button>
                        <div className="hidden md:block h-6 w-[1px] bg-slate-800"></div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-base md:text-xl font-black tracking-tight">{symbol} Mali Tablolar</h1>
                                <span className="hidden sm:inline px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[8px] md:text-[9px] font-black rounded uppercase border border-indigo-500/20">Yıllık</span>
                            </div>
                            <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Para Birimi: USD</p>
                        </div>
                    </div>

                    {/* STATS SUMMARY */}
                    <div className="hidden xl:flex items-center gap-10">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Market Cap</span>
                            <span className="text-sm font-black text-slate-200">{formatNumber(data?.fundamentals?.marketCap)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">P/E Ratio</span>
                            <span className="text-sm font-black text-slate-200">{data?.fundamentals?.peRatio?.toFixed(2) || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Div. Yield</span>
                            <span className="text-sm font-black text-emerald-400">{data?.fundamentals?.dividendYield ? `${(data.fundamentals.dividendYield * 100).toFixed(2)}%` : "—"}</span>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <button className="hidden sm:flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl transition-all font-bold text-xs border border-slate-700">
                            <Download size={16} /> Export
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto p-4 md:p-8">
                {/* NAVIGATION / TABS */}
                <div className="flex flex-col gap-4 md:gap-6 mb-6 md:mb-10">
                    <div className="overflow-x-auto pb-2 md:pb-0">
                        <div className="flex p-1 md:p-1.5 bg-[#1e222d] border border-slate-800/50 rounded-xl md:rounded-2xl shadow-inner w-fit min-w-full md:min-w-0">
                            {["Income Statement", "Balance Sheet", "Cash Flow"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 md:flex-none px-3 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl font-black text-[10px] md:text-xs uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab
                                        ? 'bg-[#0f111a] text-white shadow-lg border border-slate-700/50'
                                        : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    {tab === "Income Statement" ? "Gelir" : tab === "Balance Sheet" ? "Bilanço" : "Nakit Akışı"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-500/5 border border-indigo-500/10 rounded-xl w-fit">
                        <Info size={14} className="text-indigo-400/80" />
                        <span className="text-[10px] font-bold text-indigo-400/80 uppercase tracking-widest">Historical Data Provided by Tiingo</span>
                    </div>
                </div>

                {/* DATA TABLE */}
                <div className="bg-[#1e222d] border border-slate-800 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="bg-[#242835] border-b border-slate-800">
                                    <th className="px-4 md:px-8 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 sticky left-0 bg-[#242835] z-20 min-w-[160px] md:min-w-[280px] shadow-[4px_0_10px_-2px_rgba(0,0,0,0.4)]">
                                        Financial Line Items (USD)
                                    </th>
                                    {history.map((stmt) => (
                                        <th key={stmt.date} className="px-4 md:px-10 py-4 md:py-6 text-right text-[10px] md:text-xs font-black text-slate-300 min-w-[100px] md:min-w-[160px] uppercase tracking-tighter">
                                            {stmt.year || new Date(stmt.date).getFullYear()}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                                {rows.map((row, idx) => (
                                    <tr
                                        key={row.key}
                                        className={`group transition-colors ${idx % 2 === 0 ? 'bg-[#1e222d]' : 'bg-[#191d29]'} hover:bg-indigo-500/5`}
                                    >
                                        <td className={`px-4 md:px-8 py-3 md:py-5 text-xs md:text-sm sticky left-0 z-10 font-bold transition-all ${row.color || 'text-slate-300'} 
                                            ${idx % 2 === 0 ? 'bg-[#1e222d]' : 'bg-[#191d29]'} group-hover:bg-[#202534] shadow-[4px_0_10px_-2px_rgba(0,0,0,0.4)]`}>
                                            <div className="flex items-center gap-2 md:gap-3">
                                                <div className={`w-1 h-1 rounded-full ${row.bold ? 'bg-indigo-500 scale-125' : 'bg-slate-700'}`}></div>
                                                <span className={`${row.bold ? 'font-black' : 'font-semibold'} line-clamp-1`}>{row.label}</span>
                                            </div>
                                        </td>
                                        {history.map((stmt) => {
                                            const val = stmt[row.key];
                                            const isNeg = val < 0;
                                            return (
                                                <td
                                                    key={stmt.date}
                                                    className={`px-4 md:px-10 py-3 md:py-5 text-right font-mono text-xs md:text-sm ${row.bold ? 'text-slate-100 font-bold' : 'text-slate-400'} 
                                                        ${isNeg ? 'text-rose-400' : ''}`}
                                                >
                                                    {formatNumber(val)}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[9px] text-slate-600 font-bold uppercase tracking-widest bg-[#161a24] p-6 rounded-2xl border border-slate-800/40">
                    <div className="flex items-center gap-4">
                        <span>© 2026 FinBot Global Financials</span>
                        <div className="hidden sm:block w-1 h-1 bg-slate-800 rounded-full"></div>
                        <span className="text-slate-500">Source: Tiingo Professional Data</span>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-500/80">
                        <Activity size={14} />
                        <span>Real-time aggregation active</span>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Financials;
