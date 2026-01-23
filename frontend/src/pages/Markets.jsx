import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../lib/api";
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
    const [activeTab, setActiveTab] = useState("Stocks");
    const [loading, setLoading] = useState(true);
    const [marketData, setMarketData] = useState([]);

    const ASSETS = {
        Stocks: [
            { symbol: 'AAPL', name: 'Apple Inc.' },
            { symbol: 'MSFT', name: 'Microsoft' },
            { symbol: 'NVDA', name: 'NVIDIA' },
            { symbol: 'TSLA', name: 'Tesla' },
            { symbol: 'AMZN', name: 'Amazon' },
            { symbol: 'GOOGL', name: 'Alphabet' },
            { symbol: 'META', name: 'Meta' },
            { symbol: 'BRK.B', name: 'Berkshire' },
            { symbol: 'JPM', name: 'JPMorgan' },
            { symbol: 'V', name: 'Visa' }
        ],
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

    const fetchMarketData = async () => {
        setLoading(true);
        const currentAssets = ASSETS[activeTab];
        try {
            const results = await Promise.all(currentAssets.map(async (asset) => {
                try {
                    const res = await api.get(`/stock-analysis/${asset.symbol}`);
                    if (res.data.ok) {
                        return {
                            ...asset,
                            price: res.data.data.price,
                            change: res.data.data.changePercent
                        };
                    }
                } catch (err) {
                    console.error(`Error fetching ${asset.symbol}:`, err);
                }
                return { ...asset, price: 0, change: 0 };
            }));
            setMarketData(results);
        } catch (err) {
            console.error("Market fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMarketData();
        const interval = setInterval(fetchMarketData, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [activeTab]);

    return (
        <div className="min-h-screen bg-[#0f111a] text-white p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-white mb-1">Global Markets</h1>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Real-time Multi-Asset Tracking</p>
                    </div>
                    <button
                        onClick={fetchMarketData}
                        className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all text-slate-400 hover:text-white"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-1.5 bg-[#1e222d] border border-slate-800 rounded-2xl w-fit mb-8">
                    {[
                        { id: "Stocks", icon: BarChart3 },
                        { id: "Crypto", icon: Coins },
                        { id: "Forex", icon: Globe }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === tab.id
                                    ? 'bg-[#0f111a] text-emerald-400 shadow-xl border border-slate-700'
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.id}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-[#1e222d] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#2a2e39] border-b border-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                <th className="px-8 py-5">Asset</th>
                                <th className="px-8 py-5">Price</th>
                                <th className="px-8 py-5 text-right">Daily Change</th>
                                <th className="px-8 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {marketData.map((asset) => (
                                <tr
                                    key={asset.symbol}
                                    onClick={() => navigate(`/screener/${asset.symbol}`)}
                                    className="hover:bg-indigo-500/5 cursor-pointer transition-colors group"
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-200 group-hover:text-emerald-400 transition-colors">{asset.symbol}</span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{asset.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 font-mono text-sm font-bold">
                                        {asset.price ? (
                                            activeTab === "Forex" ? asset.price.toFixed(4) :
                                                activeTab === "Crypto" ? asset.price.toLocaleString('en-US') :
                                                    asset.price.toFixed(2)
                                        ) : "—"}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-black text-xs ${asset.change >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                            }`}>
                                            {asset.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                            {asset.change?.toFixed(2)}%
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right text-slate-700 group-hover:text-slate-400 transition-colors">
                                        <ChevronRight size={18} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Info */}
                <div className="mt-8 flex items-center justify-between text-[9px] font-black text-slate-600 uppercase tracking-widest bg-[#161a25] p-5 rounded-2xl border border-slate-800/50">
                    <div className="flex items-center gap-4">
                        <span>© 2026 FinBot Intelligence</span>
                        <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
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
