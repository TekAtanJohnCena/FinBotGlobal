import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Send,
  Clock,
  DollarSign,
  Coffee,
  ShoppingBag,
  Zap,
  Gift,
  Car,
  Home,
  Plane,
  CreditCard,
  PlusCircle,
  Trash2,
  RefreshCw,
  ChevronRight,
  Eye,
  EyeOff,
  Timer,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  HandCoins,
  Banknote
} from "lucide-react";

// Category detection and icons
const CATEGORIES = {
  income: { label: "Gelir", color: "emerald", icon: TrendingUp, keywords: ["maaş", "harçlık", "bayram", "hediye", "ödeme aldım", "kazandım", "gelir"] },
  expense: { label: "Gider", color: "rose", icon: TrendingDown, keywords: ["market", "fatura", "yemek", "kahve", "kira", "alışveriş", "aldım", "ödedim", "harcadım"] },
  debt_out: { label: "Borç Verdim", color: "amber", icon: HandCoins, keywords: ["borç verdim", "arkadaşa", "verdiğim"] },
  debt_in: { label: "Borç Aldım", color: "purple", icon: CreditCard, keywords: ["borç aldım", "aldığım borç", "ödeyeceğim"] }
};

// Smart text parser
const parseEntry = (text) => {
  const lowerText = text.toLowerCase().trim();
  let type = "expense";
  let amount = 0;
  let description = text;

  const amountMatch = text.match(/(\d+[\.,]?\d*)\s*(tl|₺)?/i);
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
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [entries, setEntries] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTimeMachine, setIsTimeMachine] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);
  const [projectedWealth, setProjectedWealth] = useState(0);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const total = entries.reduce((acc, e) => {
      if (e.type === "income" || e.type === "debt_in") return acc + e.amount;
      if (e.type === "expense" || e.type === "debt_out") return acc - e.amount;
      return acc;
    }, 0);
    setTotalBalance(total);
    const avgMonthlyNet = total / Math.max(1, getMonthsOfData());
    setProjectedWealth(total + (avgMonthlyNet * 60 * 1.08));
  }, [entries]);

  const getMonthsOfData = () => {
    if (entries.length === 0) return 1;
    const oldest = new Date(Math.min(...entries.map(e => new Date(e.date))));
    return Math.max(1, (new Date() - oldest) / (1000 * 60 * 60 * 24 * 30));
  };

  const getUserKey = () => user?.email || user?._id || "guest";

  const loadData = () => {
    const saved = localStorage.getItem(`finbot_wallet_v2_${getUserKey()}`);
    if (saved) {
      setEntries(JSON.parse(saved).entries || []);
    } else {
      setEntries([
        { id: "1", type: "income", amount: 35000, description: "Maaş", date: new Date().toISOString(), rawText: "Maaş 35000TL" },
        { id: "2", type: "expense", amount: 2500, description: "Market alışverişi", date: new Date(Date.now() - 86400000).toISOString(), rawText: "Market 2500TL" },
        { id: "3", type: "expense", amount: 450, description: "Elektrik faturası", date: new Date(Date.now() - 172800000).toISOString(), rawText: "Elektrik faturası 450" },
        { id: "4", type: "debt_out", amount: 500, description: "Arkadaşa borç", date: new Date(Date.now() - 259200000).toISOString(), rawText: "Arkadaşa borç 500TL" },
        { id: "ai_insight", type: "ai_insight", message: "Bu ayki tasarrufunla 5 yıl önceki Apple hissesinden +$2,450 kârdaydın! 📈", date: new Date(Date.now() - 345600000).toISOString() }
      ]);
    }
  };

  const saveData = (newEntries) => {
    localStorage.setItem(`finbot_wallet_v2_${getUserKey()}`, JSON.stringify({ entries: newEntries }));
    setEntries(newEntries);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    const parsed = parseEntry(inputText);
    if (parsed.amount <= 0) { toast.error("Lütfen geçerli bir tutar girin"); return; }
    const newEntry = { id: Date.now().toString(), ...parsed, date: new Date().toISOString() };
    saveData([newEntry, ...entries]);
    setInputText("");
    toast.success(`${CATEGORIES[parsed.type].label}: ₺${parsed.amount.toLocaleString('tr-TR')}`);
  };

  const deleteEntry = (id) => { saveData(entries.filter(e => e.id !== id)); toast.success("Silindi"); };

  const getCategoryColor = (type) => ({
    income: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/40",
    expense: "from-rose-500/20 to-rose-500/5 border-rose-500/40",
    debt_out: "from-amber-500/20 to-amber-500/5 border-amber-500/40",
    debt_in: "from-purple-500/20 to-purple-500/5 border-purple-500/40",
    ai_insight: "from-indigo-500/20 to-purple-500/5 border-indigo-500/40"
  }[type] || "from-rose-500/20 to-rose-500/5 border-rose-500/40");

  const getTextColor = (type) => ({ income: "text-emerald-400", expense: "text-rose-400", debt_out: "text-amber-400", debt_in: "text-purple-400" }[type] || "text-slate-300");

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const diff = new Date() - date;
    if (diff < 86400000) return "Bugün";
    if (diff < 172800000) return "Dün";
    if (diff < 604800000) return date.toLocaleDateString('tr-TR', { weekday: 'long' });
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const groupEntriesByDate = () => {
    const groups = {};
    entries.forEach(entry => {
      const dateKey = formatDate(entry.date);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(entry);
    });
    return groups;
  };

  const monthlyIncome = entries.filter(e => e.type === "income").reduce((a, e) => a + e.amount, 0);
  const monthlyExpense = entries.filter(e => e.type === "expense").reduce((a, e) => a + e.amount, 0);
  const groupedEntries = groupEntriesByDate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e1a] via-[#0d1321] to-[#0a0e1a] text-white">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1e293b', color: '#fff', borderRadius: '16px' } }} />

      <div className="max-w-7xl mx-auto px-4 lg:px-8 pb-32">

        {/* HEADER */}
        <div className="pt-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Wallet className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg lg:text-2xl font-bold text-white">Hibrit Cüzdan</h1>
                <p className="text-[10px] lg:text-xs text-slate-500 uppercase tracking-wider font-medium">Akıllı Finans Takibi</p>
              </div>
            </div>
            <button
              onClick={() => setIsTimeMachine(!isTimeMachine)}
              className={`flex items-center gap-1.5 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-[10px] lg:text-xs font-bold uppercase tracking-wide transition-all ${isTimeMachine ? "bg-purple-500/20 text-purple-400 border border-purple-500/40" : "bg-slate-800/50 text-slate-400 border border-slate-700"}`}
            >
              <Timer className="w-3 h-3 lg:w-4 lg:h-4" />
              {isTimeMachine ? "Zaman Makinesi" : "Güncel"}
            </button>
          </div>

          {/* Desktop: 3-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Balance Card - 2 columns */}
            <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-6 lg:p-8 border border-slate-700/50 shadow-2xl">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs lg:text-sm text-slate-400 uppercase tracking-wider font-medium">
                    {isTimeMachine ? "5 Yıllık Projeksiyon" : "Mevcut Bakiye"}
                  </p>
                  <button onClick={() => setShowBalance(!showBalance)} className="text-slate-500 hover:text-white transition">
                    {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-baseline gap-2 mb-4 lg:mb-6">
                  <span className="text-4xl lg:text-6xl font-black text-white tracking-tight">
                    {showBalance ? `₺${(isTimeMachine ? projectedWealth : totalBalance).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}` : "••••••"}
                  </span>
                  {isTimeMachine && (
                    <span className="text-emerald-400 text-sm lg:text-base font-bold flex items-center gap-1">
                      <ArrowUpRight className="w-4 h-4" /> +{((projectedWealth / Math.max(1, totalBalance) - 1) * 100).toFixed(0)}%
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-emerald-500/10 rounded-xl px-3 py-2 border border-emerald-500/20">
                    <div className="flex items-center gap-1.5 mb-0.5"><ArrowUpRight className="w-3 h-3 text-emerald-400" /><span className="text-[10px] text-emerald-300/80 uppercase font-bold">Gelir</span></div>
                    <p className="text-sm lg:text-base font-bold text-emerald-400">₺{monthlyIncome.toLocaleString('tr-TR')}</p>
                  </div>
                  <div className="bg-rose-500/10 rounded-xl px-3 py-2 border border-rose-500/20">
                    <div className="flex items-center gap-1.5 mb-0.5"><ArrowDownRight className="w-3 h-3 text-rose-400" /><span className="text-[10px] text-rose-300/80 uppercase font-bold">Gider</span></div>
                    <p className="text-sm lg:text-base font-bold text-rose-400">₺{monthlyExpense.toLocaleString('tr-TR')}</p>
                  </div>
                  <div className="hidden lg:block bg-amber-500/10 rounded-xl px-3 py-2 border border-amber-500/20">
                    <div className="flex items-center gap-1.5 mb-0.5"><HandCoins className="w-3 h-3 text-amber-400" /><span className="text-[10px] text-amber-300/80 uppercase font-bold">Net</span></div>
                    <p className="text-sm lg:text-base font-bold text-amber-400">₺{(monthlyIncome - monthlyExpense).toLocaleString('tr-TR')}</p>
                  </div>
                  <div className="hidden lg:block bg-purple-500/10 rounded-xl px-3 py-2 border border-purple-500/20">
                    <div className="flex items-center gap-1.5 mb-0.5"><LineChart className="w-3 h-3 text-purple-400" /><span className="text-[10px] text-purple-300/80 uppercase font-bold">İşlem</span></div>
                    <p className="text-sm lg:text-base font-bold text-purple-400">{entries.filter(e => e.type !== 'ai_insight').length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel - Desktop */}
            <div className="hidden lg:flex flex-col gap-4">
              <div className="flex-1 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-700/50">
                <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-400" />Hızlı Eylemler</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[{ label: "Market", emoji: "🛒", text: "Market " }, { label: "Fatura", emoji: "⚡", text: "Fatura " }, { label: "Maaş", emoji: "💰", text: "Maaş " }, { label: "Borç", emoji: "💳", text: "Borç verdim " }].map((action) => (
                    <button key={action.label} onClick={() => { setInputText(action.text); inputRef.current?.focus(); }} className="p-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-xl text-left transition group">
                      <span className="text-xl mb-1 block">{action.emoji}</span>
                      <span className="text-xs font-medium text-slate-400 group-hover:text-white">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl p-4 border border-indigo-500/30">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center"><Sparkles className="w-4 h-4 text-white" /></div>
                  <div><p className="text-[10px] text-indigo-400 font-bold uppercase mb-1">AI İpucu</p><p className="text-xs text-slate-400 leading-relaxed">Sadece yaz: "Market 500TL" veya "Maaş 35000"</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SMART FEED - 2 Columns on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {Object.entries(groupedEntries).map(([dateLabel, dayEntries]) => (
            <div key={dateLabel} className="lg:contents">
              {dayEntries.map((entry) => {
                if (entry.type === "ai_insight") {
                  return (
                    <div key={entry.id} className="relative bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl p-4 border border-indigo-500/30 shadow-lg shadow-indigo-500/5">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg"><Sparkles className="w-4 h-4 text-white" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1">Zaman Makinesi İçgörüsü</p>
                          <p className="text-sm text-slate-200 leading-relaxed">{entry.message}</p>
                        </div>
                      </div>
                      <button onClick={() => navigate("/portfolio")} className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-xl text-indigo-300 text-xs font-bold transition">
                        Simülasyonu Keşfet <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                }
                const IconComponent = CATEGORIES[entry.type]?.icon || DollarSign;
                return (
                  <div key={entry.id} className={`relative bg-gradient-to-r ${getCategoryColor(entry.type)} backdrop-blur-sm rounded-2xl p-4 border shadow-lg group`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${entry.type === "income" ? "bg-emerald-500/20" : entry.type === "expense" ? "bg-rose-500/20" : entry.type === "debt_out" ? "bg-amber-500/20" : "bg-purple-500/20"}`}>
                          <IconComponent className={`w-5 h-5 ${getTextColor(entry.type)}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{entry.description}</p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(entry.date)} • {new Date(entry.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            <span className={`ml-1 px-1.5 py-0.5 rounded ${entry.type === "income" ? "bg-emerald-500/20 text-emerald-400" : entry.type === "expense" ? "bg-rose-500/20 text-rose-400" : entry.type === "debt_out" ? "bg-amber-500/20 text-amber-400" : "bg-purple-500/20 text-purple-400"}`}>
                              {CATEGORIES[entry.type]?.label}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${getTextColor(entry.type)}`}>
                          {entry.type === "income" || entry.type === "debt_in" ? "+" : "-"}₺{entry.amount.toLocaleString('tr-TR')}
                        </span>
                        <button onClick={() => deleteEntry(entry.id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-700/50 rounded-lg transition"><Trash2 className="w-4 h-4 text-slate-500" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {entries.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-2xl flex items-center justify-center"><Banknote className="w-8 h-8 text-slate-600" /></div>
            <p className="text-slate-500 text-sm">Henüz işlem yok</p>
            <p className="text-slate-600 text-xs mt-1">Aşağıdan harcama veya gelir ekle</p>
          </div>
        )}
      </div>

      {/* FLOATING INPUT BAR */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0e1a] via-[#0a0e1a]/95 to-transparent pt-16">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="relative bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-2xl shadow-black/50">
            <input ref={inputRef} type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Borç, harçlık veya gider yaz..." className="w-full bg-transparent px-5 py-4 pr-14 text-white placeholder:text-slate-500 focus:outline-none text-sm lg:text-base" />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all active:scale-95">
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="flex justify-center gap-2 mt-3 lg:hidden">
            {[{ label: "Market", emoji: "🛒" }, { label: "Fatura", emoji: "⚡" }, { label: "Borç", emoji: "💳" }, { label: "Harçlık", emoji: "🎁" }].map((tag) => (
              <button key={tag.label} type="button" onClick={() => setInputText(tag.label + " ")} className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-full text-xs font-medium text-slate-400 hover:text-white transition flex items-center gap-1">
                <span>{tag.emoji}</span><span>{tag.label}</span>
              </button>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}
