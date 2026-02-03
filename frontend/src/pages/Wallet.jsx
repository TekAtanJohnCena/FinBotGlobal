import { useState, useEffect, useContext, useRef, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { useQuery } from '@tanstack/react-query';
import api from "../lib/api";
import {
  Wallet, TrendingUp, TrendingDown, Send, Clock,
  CreditCard, PlusCircle, Trash2, RefreshCw, Eye, EyeOff,
  LineChart, HandCoins, Banknote,
  PieChart as PieIcon, ArrowLeftRight, Activity, Download
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// --- CONFIGURATION ---
const CATEGORIES = {
  income: { label: "Gelir", color: "#10b981", bg: "bg-emerald-500/20", text: "text-emerald-400", icon: TrendingUp, keywords: ["maaş", "harçlık", "bayram", "hediye", "ödeme", "kazanç", "gelir"] },
  expense: { label: "Gider", color: "#f43f5e", bg: "bg-rose-500/20", text: "text-rose-400", icon: TrendingDown, keywords: ["market", "fatura", "yemek", "kira", "alışveriş", "harcama", "gider"] },
  investment: { label: "Yatırım", color: "#8b5cf6", bg: "bg-violet-500/20", text: "text-violet-400", icon: LineChart, keywords: ["hisse", "altın", "döviz", "fon", "kripto", "yatırım"] },
  debt_out: { label: "Borç Verdim", color: "#f59e0b", bg: "bg-amber-500/20", text: "text-amber-400", icon: HandCoins, keywords: ["borç ver", "verdim"] },
  debt_in: { label: "Borç Aldım", color: "#6366f1", bg: "bg-indigo-500/20", text: "text-indigo-400", icon: CreditCard, keywords: ["borç al", "aldım"] }
};

const parseEntry = (text) => {
  const lowerText = text.toLowerCase().trim();
  let type = "expense";
  let amount = 0;
  let description = text;

  const amountMatch = text.match(/(\d+[.,]?\d*)\s*(tl|₺|\$)?/i);
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(",", "."));
    description = text.replace(amountMatch[0], "").trim();
  }

  for (const [key, cat] of Object.entries(CATEGORIES)) {
    if (cat.keywords.some(kw => lowerText.includes(kw))) {
      type = key;
      break;
    }
  }

  return { type, amount, description: description || type, rawText: text };
};

export default function WalletPage() {
  const { user } = useContext(AuthContext);
  const inputRef = useRef(null);

  // State
  const [entries, setEntries] = useState([]);
  const [inputText, setInputText] = useState("");
  const [showBalance, setShowBalance] = useState(true);

  // --- INTEGRATED DATA START ---
  // Fetch Portfolio Data to merge with Wallet
  const { data: portfolioRes } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => (await api.get('/portfolio')).data,
    staleTime: 60000,
  });

  const portfolioValue = portfolioRes?.totals?.totalValue || 0;
  const portfolioPnL = portfolioRes?.totals?.totalPnl || 0;
  // --- INTEGRATED DATA END ---

  // Load Wallet Data
  useEffect(() => {
    const saved = localStorage.getItem(`finbot_wallet_v2_${user?.email || "guest"}`);
    if (saved) {
      setEntries(JSON.parse(saved).entries || []);
    } else {
      // Default Data
      const defaults = [
        { id: "1", type: "income", amount: 35000, description: "Maaş", date: new Date().toISOString(), status: "completed" },
        { id: "2", type: "expense", amount: 2500, description: "Market", date: new Date(Date.now() - 86400000).toISOString(), status: "completed" },
        { id: "3", type: "investment", amount: 5000, description: "Borsa Transfer", date: new Date(Date.now() - 172800000).toISOString(), status: "completed" }
      ];
      setEntries(defaults);
      localStorage.setItem(`finbot_wallet_v2_${user?.email || "guest"}`, JSON.stringify({ entries: defaults }));
    }
  }, [user]);

  // Derived Calculations
  const { netWealth, assetAllocation } = useMemo(() => {
    const cash = entries.reduce((acc, e) => {
      const amount = e.amount ?? 0;
      if (["income", "debt_in"].includes(e.type)) return acc + amount;
      if (["expense", "debt_out", "investment"].includes(e.type)) return acc - amount;
      return acc;
    }, 0);

    const wealth = cash + portfolioValue;

    const allocation = [
      { name: "Nakit", value: cash > 0 ? cash : 0, color: "#10b981" },
      { name: "Portföy", value: portfolioValue, color: "#6366f1" } // Portfolio (Stocks)
    ].filter(i => i.value > 0);

    return { cashBalance: cash, netWealth: wealth, assetAllocation: allocation };
  }, [entries, portfolioValue]);

  // Actions
  const handleAddEntry = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    const parsed = parseEntry(inputText);
    if (parsed.amount <= 0) { toast.error("Geçersiz tutar"); return; }

    const newEntry = {
      id: Date.now().toString(),
      ...parsed,
      date: new Date().toISOString(),
      status: "completed"
    };

    const newEntries = [newEntry, ...entries];
    setEntries(newEntries);
    localStorage.setItem(`finbot_wallet_v2_${user?.email || "guest"}`, JSON.stringify({ entries: newEntries }));
    setInputText("");
    toast.success("İşlem Eklendi");
  };

  const deleteEntry = (id) => {
    const newEntries = entries.filter(e => e.id !== id);
    setEntries(newEntries);
    localStorage.setItem(`finbot_wallet_v2_${user?.email || "guest"}`, JSON.stringify({ entries: newEntries }));
    toast.success("Silindi");
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0f1c] text-white font-sans overflow-hidden">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1e293b', color: '#fff' } }} />

      {/* --- SCROLLABLE CONTENT --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8 pb-32 lg:pb-8">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* 1. HEADER & BALANCE CARD */}
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1e222d] to-[#13151b] border border-slate-800 p-6 lg:p-8 shadow-2xl">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 w-fit">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Toplam Varlıklar</span>
                </div>
                <button onClick={() => setShowBalance(!showBalance)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white">
                  {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>

              <div className="flex flex-col gap-1 mb-8">
                <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-white">
                  {showBalance ? `₺${netWealth.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}` : "••••••"}
                </h1>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold flex items-center gap-1 ${portfolioPnL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {portfolioPnL >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    Portföy Etkisi: {portfolioPnL >= 0 ? "+" : ""}${Math.abs(portfolioPnL).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* ACTION HUB */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Ekle", icon: PlusCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", action: () => inputRef.current?.focus() },
                  { label: "Çek", icon: Download, color: "text-rose-400", bg: "bg-rose-500/10", action: () => toast("Çekim işlemi simülasyonu") },
                  { label: "Transfer", icon: ArrowLeftRight, color: "text-indigo-400", bg: "bg-indigo-500/10", action: () => toast("Transfer işlemi simülasyonu") },
                  { label: "Dönüştür", icon: RefreshCw, color: "text-amber-400", bg: "bg-amber-500/10", action: () => toast("Döviz dönüşüm") },
                ].map((btn, idx) => (
                  <button key={idx} onClick={btn.action} className="flex flex-col items-center gap-2 group">
                    <div className={`w-14 h-14 ${btn.bg} rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-105 transition-transform shadow-lg`}>
                      <btn.icon className={`w-6 h-6 ${btn.color}`} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. ANALYTICS SECTION (Allocation & PnL) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Asset Allocation Chart */}
            <div className="bg-[#1e222d] border border-slate-800 rounded-3xl p-6 relative">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <PieIcon size={14} className="text-indigo-400" /> Varlık Dağılımı
              </h3>
              <div className="h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={assetAllocation} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                      {assetAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e222d', borderRadius: '12px', border: '1px solid #334155', color: '#fff' }}
                      itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {assetAllocation.map(i => (
                  <div key={i.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: i.color }} />
                    <span className="text-xs font-bold text-slate-400">{i.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulated PnL / Activity Chart */}
            <div className="bg-[#1e222d] border border-slate-800 rounded-3xl p-6">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity size={14} className="text-emerald-400" /> Hareket Analizi (7 Gün)
              </h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={entries.slice(0, 7).reverse()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                    <XAxis dataKey="type" hide />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#1e222d', borderRadius: '12px', border: '1px solid #334155', color: '#fff' }}
                    />
                    <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 3. TRANSACTION HISTORY */}
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} className="text-slate-500" /> Son İşlemler
              </h3>
              <button onClick={() => setEntries([])} className="text-[10px] font-bold text-rose-500 hover:text-rose-400 uppercase tracking-widest bg-rose-500/10 px-3 py-1.5 rounded-lg transition-colors">
                Geçmişi Temizle
              </button>
            </div>

            <div className="space-y-3">
              {entries.map((entry) => {
                const Cat = CATEGORIES[entry.type] || CATEGORIES.expense;
                const Icon = Cat.icon;
                return (
                  <div key={entry.id} className="group relative bg-[#1e222d] hover:bg-[#252a37] border border-slate-800 rounded-2xl p-4 transition-all flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${Cat.bg} flex items-center justify-center border border-white/5`}>
                      <Icon className={`w-6 h-6 ${Cat.text}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-white truncate capitalize">{entry.description}</h4>
                        <span className={`text-sm font-black ${["income", "debt_in"].includes(entry.type) ? "text-emerald-400" : "text-rose-400"}`}>
                          {["income", "debt_in"].includes(entry.type) ? "+" : "-"}₺{(entry.amount ?? 0).toLocaleString('tr-TR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider text-slate-400 border border-slate-700/50">
                          {entry.status === "completed" ? "Tamamlandı" : "İşleniyor"}
                        </span>
                        <span>{new Date(entry.date).toLocaleDateString("tr-TR", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <button onClick={() => deleteEntry(entry.id)} className="absolute right-4 opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}

              {entries.length === 0 && (
                <div className="text-center py-20 bg-slate-800/20 rounded-3xl border border-dashed border-slate-700">
                  <Banknote className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                  <p className="text-sm font-bold text-slate-500">Henüz işlem bulunmuyor</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* --- FLOATING INPUT BAR --- */}
      <div className="bg-[#1e222d] border-t border-slate-800 p-4 pb-8 lg:pb-4 safe-area-bottom z-20">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleAddEntry} className="relative">
            <input
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={false}
              placeholder="Örn: Market 500, Maaş 35000..."
              className="w-full bg-[#0a0f1c] text-white px-5 py-4 rounded-2xl border border-slate-700 focus:border-emerald-500 focus:outline-none placeholder:text-slate-600 font-medium text-sm transition-colors pr-14 shadow-inner"
            />
            <button type="submit" className="absolute right-2 top-2 p-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white transition-colors shadow-lg shadow-emerald-600/20">
              <Send size={18} />
            </button>
          </form>
          {/* Quick Tags Mobile */}
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar lg:justify-center">
            {["🛒 Market", "⚡ Fatura", "💰 Maaş", "🎁 Hediyem"].map(tag => (
              <button
                key={tag}
                onClick={() => setInputText(tag + " ")}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-slate-400 whitespace-nowrap transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
