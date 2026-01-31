import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from "../lib/api";
import { formatTicker } from '../lib/tickerUtils';
import {
    TrendingUp,
    TrendingDown,
    ChevronRight,
    Activity,
    Coins,
    Globe,
    BarChart3,
    RefreshCw
} from 'lucide-react';

const Markets = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("US Markets");
    const [activeSector, setActiveSector] = useState("");

    const SECTORS = [
        { label: "Tümü", value: "" },
        { label: "Teknoloji", value: "Technology" },
        { label: "Finansal Hizmetler", value: "Financial Services" },
        { label: "Sağlık", value: "Healthcare" },
        { label: "Enerji", value: "Energy" },
        { label: "Endüstriyel", value: "Industrials" },
        { label: "Tüketici Döngüsel", value: "Consumer Cyclical" },
        { label: "Tüketici Savunma", value: "Consumer Defensive" },
        { label: "Gayrimenkul", value: "Real Estate" },
        { label: "Kamu Hizmetleri", value: "Utilities" },
        { label: "İletişim", value: "Communication Services" },
        { label: "Temel Malzemeler", value: "Basic Materials" }
    ];

    // Static Asset Config (Crypto/Forex kept hardcoded for now)
    const STATIC_ASSETS = {
        Crypto: [
            { symbol: 'BTCUSD', name: 'Bitcoin' },
            { symbol: 'ETHUSD', name: 'Ethereum' },
            { symbol: 'SOLUSD', name: 'Solana' },
            { symbol: 'DOGEUSD', name: 'Dogecoin' }
        ],
        Forex: [
            { symbol: 'EURUSD', name: 'EUR / USD' },
            { symbol: 'USDTRY', name: 'USD / TRY' },
            { symbol: 'GBPUSD', name: 'GBP / USD' },
            { symbol: 'XAUUSD', name: 'Gold / USD' }
        ]
    };

    const {
        data: marketData,
        isLoading: loading,
        refetch
    } = useQuery({
        queryKey: ['markets', activeTab, activeSector],
        queryFn: async () => {
            let currentAssets = [];

            if (activeTab === "US Markets") {
                // Fetch dynamic list from backend
                const response = await api.get(`/stocks/market?sector=${activeSector}`);
                if (response.data.ok) {
                    currentAssets = response.data.data;
                }
            } else {
                currentAssets = STATIC_ASSETS[activeTab] || [];
            }

            const results = await Promise.all(currentAssets.map(async (asset) => {
                try {
                    const res = await api.get(`/stock-analysis/${asset.symbol}`);
                    if (res.data.ok) {
                        return {
                            ...asset,
                            price: res.data.data.price,
                            change: res.data.data.changePercent,
                            yield: res.data.data.fundamentals?.dividendYield
                        };
                    }
                } catch (err) {
                    console.error(`Error fetching ${asset.symbol}:`, err);
                }
                return { ...asset, price: 0, change: 0 };
            }));
            return results;
        },
        refetchInterval: 60000,
        staleTime: 30000,
        placeholderData: (previousData) => previousData // Keep prev data while fetching new tab
    });

    return (
        <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-1">Global Markets</h1>
                        <p className="text-slate-500 text-xs md:text-sm font-bold uppercase tracking-widest">Real-time Multi-Asset Tracking</p>
                    </div>
                    <button
                        onClick={() => refetch()}
                        className="p-2.5 md:p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all text-slate-400 hover:text-white"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="overflow-x-auto pb-2 mb-6 md:mb-8 flex flex-col sm:flex-row gap-4">
                    <div className="flex p-1.5 bg-[#1e222d] border border-slate-800 rounded-2xl w-fit min-w-full md:min-w-0">
                        {[
                            { id: "US Markets", icon: BarChart3 },
                            { id: "Crypto", icon: Coins },
                            { id: "Forex", icon: Globe }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 md:px-8 py-2.5 md:py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-[#0f111a] text-emerald-400 shadow-xl border border-slate-700'
                                    : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.id}
                            </button>
                        ))}
                    </div>

                    {activeTab === "US Markets" && (
                        <div className="flex p-1.5 bg-[#1e222d] border border-slate-800 rounded-2xl w-fit">
                            <select
                                value={activeSector}
                                onChange={(e) => setActiveSector(e.target.value)}
                                className="bg-[#1e222d] text-xs font-black uppercase tracking-wider text-slate-400 px-4 py-2 rounded-xl outline-none cursor-pointer hover:text-slate-200 transition-all appearance-none"
                            >
                                {SECTORS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="bg-[#1e222d] border border-slate-800 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="bg-[#2a2e39] border-b border-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                    <th className="px-4 md:px-8 py-4 md:py-5 sticky left-0 z-20 bg-[#2a2e39]">Asset</th>
                                    <th className="px-4 md:px-8 py-4 md:py-5">Price</th>
                                    <th className="px-4 md:px-8 py-4 md:py-5 text-right">Daily Change</th>
                                    <th className="px-4 md:px-8 py-4 md:py-5 text-right hidden lg:table-cell">Dividend Yield</th>
                                    <th className="px-4 md:px-8 py-4 md:py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {(marketData || []).map((asset) => (
                                    <tr
                                        key={asset.symbol}
                                        onClick={() => navigate(`/screener/${formatTicker(asset.symbol)}`)}
                                        className="hover:bg-indigo-500/5 active:bg-indigo-500/10 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-4 md:px-8 py-4 md:py-5 sticky left-0 z-10 bg-[#1e222d] group-hover:bg-[#212537] transition-colors">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-200 group-hover:text-emerald-400 transition-colors">{asset.symbol}</span>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">{asset.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-8 py-4 md:py-5 font-mono text-sm font-bold">
                                            {asset.price ? (
                                                activeTab === "Forex" ? asset.price.toFixed(4) :
                                                    activeTab === "Crypto" ? asset.price.toLocaleString('en-US') :
                                                        asset.price.toFixed(2)
                                            ) : "—"}
                                        </td>
                                        <td className="px-4 md:px-8 py-4 md:py-5 text-right">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 md:px-3 py-1 rounded-lg font-black text-xs ${asset.change >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                                }`}>
                                                {asset.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                {asset.change?.toFixed(2)}%
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-8 py-4 md:py-5 text-right hidden lg:table-cell">
                                            <span className="font-mono text-sm font-bold text-slate-400">
                                                {asset.yield ? `%${(asset.yield * 100).toFixed(2)}` : "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 md:px-8 py-4 md:py-5 text-right text-slate-700 group-hover:text-slate-400 transition-colors">
                                            <ChevronRight size={18} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-6 md:mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 text-[9px] font-black text-slate-600 uppercase tracking-widest bg-[#161a25] p-4 md:p-5 rounded-2xl border border-slate-800/50">
                    <div className="flex flex-wrap items-center gap-3 md:gap-4">
                        <span>© 2026 FinBot Intelligence</span>
                        <span className="w-1 h-1 bg-slate-800 rounded-full hidden sm:block"></span>
                        <span>Multi-Asset Streaming Active</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-500/70">
                        <Activity size={14} />
                        <span>Connected to Professional Feeds</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Markets;
