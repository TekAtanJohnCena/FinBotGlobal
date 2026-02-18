// PATH: frontend/src/pages/Wallet.jsx
// ═══════════════════════════════════════════════════════════════
// Kişisel Finans & Harcama Analiz Paneli
// Financial Engineering Dashboard - No LLM, Pure Algorithms
// ═══════════════════════════════════════════════════════════════

import { useState, useContext, useCallback, useRef, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import api from "../lib/api";
import {
  Wallet, TrendingUp, TrendingDown, Upload, DollarSign,
  AlertTriangle, Flame, Ghost, BarChart3, Target,
  PieChart as PieIcon, Calendar, ArrowUpRight, Zap,
  ChevronDown, ChevronUp, Trash2, Plus, FileText, Eye, EyeOff, X
} from "lucide-react";
import {
  ResponsiveContainer, Treemap, RadialBarChart, RadialBar, Legend,
} from "recharts";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const CATEGORY_CONFIG = {
  sabit_gider: { label: "Sabit Giderler", color: "#3b82f6", icon: "🏠", gradient: "from-blue-500/20 to-blue-600/10" },
  yasam_tarzi: { label: "Yaşam Tarzı", color: "#f59e0b", icon: "🎯", gradient: "from-amber-500/20 to-amber-600/10" },
  finansal_odeme: { label: "Finansal Ödemeler", color: "#ef4444", icon: "💳", gradient: "from-red-500/20 to-red-600/10" },
  yatirim_firsati: { label: "Yatırım Fırsatı", color: "#10b981", icon: "📈", gradient: "from-emerald-500/20 to-emerald-600/10" },
};

const DEMO_TRANSACTIONS = [
  { date: new Date().toISOString(), description: "Kira Ödemesi", amount: 12000, category: "sabit_gider" },
  { date: new Date().toISOString(), description: "Elektrik Faturası", amount: 850, category: "sabit_gider" },
  { date: new Date().toISOString(), description: "Doğalgaz Faturası", amount: 620, category: "sabit_gider" },
  { date: new Date().toISOString(), description: "İnternet", amount: 350, category: "sabit_gider" },
  { date: new Date().toISOString(), description: "Netflix", amount: 99, category: "yasam_tarzi" },
  { date: new Date().toISOString(), description: "Spotify", amount: 59, category: "yasam_tarzi" },
  { date: new Date().toISOString(), description: "Starbucks", amount: 180, category: "yasam_tarzi" },
  { date: new Date().toISOString(), description: "Trendyol Alışveriş", amount: 1200, category: "yasam_tarzi" },
  { date: new Date().toISOString(), description: "Restoran", amount: 950, category: "yasam_tarzi" },
  { date: new Date().toISOString(), description: "Spor Salonu", amount: 500, category: "yasam_tarzi" },
  { date: new Date().toISOString(), description: "Yemeksepeti", amount: 340, category: "yasam_tarzi" },
  { date: new Date().toISOString(), description: "Kredi Kartı Taksit", amount: 2500, category: "finansal_odeme" },
  { date: new Date().toISOString(), description: "İhtiyaç Kredisi", amount: 3200, category: "finansal_odeme" },
  { date: new Date().toISOString(), description: "BES Ödemesi", amount: 1000, category: "yatirim_firsati" },
  { date: new Date().toISOString(), description: "Market Alışverişi", amount: 3500, category: "sabit_gider" },
  { date: new Date().toISOString(), description: "Benzin", amount: 2200, category: "sabit_gider" },
  { date: new Date(Date.now() - 86400000 * 2).toISOString(), description: "Netflix", amount: 99, category: "yasam_tarzi" },
  { date: new Date(Date.now() - 86400000 * 5).toISOString(), description: "Spotify", amount: 59, category: "yasam_tarzi" },
  { date: new Date(Date.now() - 86400000 * 8).toISOString(), description: "Starbucks", amount: 180, category: "yasam_tarzi" },
  { date: new Date(Date.now() - 86400000 * 12).toISOString(), description: "Market", amount: 1800, category: "sabit_gider" },
  { date: new Date(Date.now() - 86400000 * 15).toISOString(), description: "Yemeksepeti", amount: 340, category: "yasam_tarzi" },
  { date: new Date(Date.now() - 86400000 * 18).toISOString(), description: "Trendyol", amount: 650, category: "yasam_tarzi" },
  { date: new Date(Date.now() - 86400000 * 22).toISOString(), description: "Eczane", amount: 420, category: "sabit_gider" },
  { date: new Date(Date.now() - 86400000 * 25).toISOString(), description: "Sinema", amount: 280, category: "yasam_tarzi" },
];

// Format currency
const fmt = (n) => "₺" + Math.abs(n).toLocaleString("tr-TR", { maximumFractionDigits: 0 });

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export function WalletPage() {
  const { user } = useContext(AuthContext);

  // Core State
  const [monthlyIncome, setMonthlyIncome] = useState(35000);
  const [incomeInput, setIncomeInput] = useState("35000");
  const [transactions, setTransactions] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [activeSection, setActiveSection] = useState(null);
  const [pdfFiles, setPdfFiles] = useState([]);   // { name, size, txCount }
  const [pdfRawText, setPdfRawText] = useState("");
  const [pdfError, setPdfError] = useState("");
  const fileInputRef = useRef(null);

  // Manual Entry State
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualDesc, setManualDesc] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualCategory, setManualCategory] = useState("yasam_tarzi");
  const [manualType, setManualType] = useState("expense"); // "income" | "expense"
  const [manualIsInstallment, setManualIsInstallment] = useState(false);
  const [manualInstallmentTotal, setManualInstallmentTotal] = useState("6");
  const [manualInstallmentCurrent, setManualInstallmentCurrent] = useState("1");
  const [manualEntryError, setManualEntryError] = useState("");

  // Load persisted transactions on mount
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.get("/transactions");
        if (res.data?.success && res.data.transactions?.length > 0) {
          const txns = res.data.transactions;
          setTransactions(txns);
          runLocalAnalysis(txns, monthlyIncome);
        }
      } catch (err) {
        // Not critical — user may not have any saved transactions yet
        console.log("No persisted transactions found.");
      }
    };
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── ANALYSIS FUNCTIONS ───
  const runAnalysis = useCallback(async (txns, income) => {
    setIsAnalyzing(true);
    try {
      const res = await api.post("/wallet/analyze-manual", {
        monthlyIncome: income,
        transactions: txns,
      });
      if (res.data?.success) {
        setAnalysisResult(res.data.analysis);
        toast.success("Analiz tamamlandı!");
      }
    } catch (err) {
      console.error("Analysis error:", err);
      // Fallback: run local analysis
      runLocalAnalysis(txns, income);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const runLocalAnalysis = useCallback((txns, income) => {
    const categorized = txns.map((t) => ({
      ...t,
      categoryLabel: CATEGORY_CONFIG[t.category]?.label || "Diğer",
      categoryColor: CATEGORY_CONFIG[t.category]?.color || "#999",
      categoryIcon: CATEGORY_CONFIG[t.category]?.icon || "📦",
    }));

    const totalExpense = categorized.reduce((s, t) => s + t.amount, 0);
    const dailyBurn = totalExpense / 30;
    const burnDay = income > 0 ? Math.min(Math.ceil(income / dailyBurn), 30) : 30;
    const savingsRate = income > 0 ? Math.round(((income - totalExpense) / income) * 100) : 0;

    // Category breakdown
    const catMap = {};
    categorized.forEach((t) => {
      if (!catMap[t.category]) catMap[t.category] = { total: 0, count: 0, items: [] };
      catMap[t.category].total += t.amount;
      catMap[t.category].count++;
      catMap[t.category].items.push({ description: t.description, amount: t.amount });
    });
    const categoryBreakdown = Object.entries(catMap).map(([key, val]) => ({
      key,
      name: CATEGORY_CONFIG[key]?.label || key,
      color: CATEGORY_CONFIG[key]?.color || "#999",
      icon: CATEGORY_CONFIG[key]?.icon || "📦",
      total: Math.round(val.total),
      count: val.count,
      items: val.items,
    })).sort((a, b) => b.total - a.total);

    // Opportunity cost — monthlySavings = 20% of income
    const monthlySavings = Math.round(income * 0.20);
    const calcProj = (monthly, rate, years) => {
      const mr = rate / 12;
      const n = years * 12;
      const fv = monthly * ((Math.pow(1 + mr, n) - 1) / mr);
      return { futureValue: Math.round(fv), totalInvested: Math.round(monthly * n), totalGain: Math.round(fv - monthly * n), annualReturn: `${(rate * 100).toFixed(1)}%`, priceOld: null, priceNow: null };
    };

    // Zombie subscriptions
    const descMap = {};
    categorized.forEach((t) => {
      const key = `${t.description.toLowerCase().substring(0, 15)}_${t.amount}`;
      if (!descMap[key]) descMap[key] = { description: t.description, amount: t.amount, count: 0, dates: [] };
      descMap[key].count++;
      descMap[key].dates.push(t.date);
    });
    const zombies = Object.values(descMap)
      .filter((z) => z.count >= 2 && z.amount <= 500)
      .map((z) => ({ ...z, monthlyWaste: z.amount, yearlyWaste: z.amount * 12, severity: z.amount * 12 > 2000 ? "high" : z.amount * 12 > 500 ? "medium" : "low" }));

    // Heatmap — month-by-month format
    const monthMap = {};
    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    categorized.forEach((t) => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return;
      const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const day = d.getDate();
      if (!monthMap[mk]) {
        monthMap[mk] = {
          month: mk,
          label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
          daysInMonth: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(),
          days: {},
          totalSpend: 0,
        };
      }
      if (!monthMap[mk].days[day]) monthMap[mk].days[day] = { day, total: 0, count: 0, transactions: [] };
      monthMap[mk].days[day].total += t.amount;
      monthMap[mk].days[day].count++;
      monthMap[mk].days[day].transactions.push(t.description);
      monthMap[mk].totalSpend += t.amount;
    });
    const heatmapData = Object.values(monthMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((m) => {
        const dayArr = [];
        const maxS = Math.max(...Object.values(m.days).map((d) => d.total), 1);
        for (let i = 1; i <= m.daysInMonth; i++) {
          const dd = m.days[i] || { day: i, total: 0, count: 0, transactions: [] };
          dayArr.push({ ...dd, intensity: dd.total / maxS, total: Math.round(dd.total * 100) / 100 });
        }
        return { ...m, days: dayArr, totalSpend: Math.round(m.totalSpend) };
      });

    setAnalysisResult({
      transactions: categorized,
      metrics: {
        monthlyIncome: income,
        totalExpense: Math.round(totalExpense),
        netBalance: Math.round(income - totalExpense),
        gaugeValue: savingsRate,
        burnRate: {
          burnDay,
          dailyBurn: Math.round(dailyBurn),
          daysRemaining: Math.max(0, burnDay - new Date().getDate()),
          totalExpense: Math.round(totalExpense),
          monthlyIncome: income,
          savingsRate,
          status: burnDay <= 15 ? "critical" : burnDay <= 22 ? "warning" : burnDay <= 28 ? "caution" : "safe",
        },
        opportunityCost: {
          monthlySavings,
          projections: {
            sp500: { label: "S&P 500", icon: "📊", year1: calcProj(monthlySavings, 0.107, 1), year5: calcProj(monthlySavings, 0.107, 5), year10: calcProj(monthlySavings, 0.107, 10) },
            gold: { label: "Altın (GLD)", icon: "🥇", year1: calcProj(monthlySavings, 0.08, 1), year5: calcProj(monthlySavings, 0.08, 5), year10: calcProj(monthlySavings, 0.08, 10) },
            nasdaq: { label: "Nasdaq 100", icon: "💻", year1: calcProj(monthlySavings, 0.15, 1), year5: calcProj(monthlySavings, 0.15, 5), year10: calcProj(monthlySavings, 0.15, 10) },
          },
        },
        zombieSubscriptions: {
          zombies,
          totalMonthlyWaste: zombies.reduce((s, z) => s + z.monthlyWaste, 0),
          totalYearlyWaste: zombies.reduce((s, z) => s + z.yearlyWaste, 0),
          count: zombies.length,
        },
      },
      charts: { heatmapData, categoryBreakdown },
      summary: {
        transactionCount: categorized.length,
        categoryCount: categoryBreakdown.length,
        healthStatus: savingsRate >= 20 ? "healthy" : savingsRate >= 0 ? "warning" : "critical",
        topCategory: categoryBreakdown[0]?.name || "N/A",
      },
    });
    toast.success("Analiz tamamlandı!");
  }, []);

  // Handle PDF Upload — supports MULTIPLE files from different banks
  const handlePdfUpload = useCallback(async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setPdfRawText("");
    setPdfError("");
    setIsAnalyzing(true);

    let allNewTxns = [...transactions]; // Start from existing transactions
    const newFiles = [...pdfFiles];
    let totalNewCount = 0;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const formData = new FormData();
      formData.append("statement", file);
      formData.append("monthlyIncome", monthlyIncome.toString());

      try {
        const res = await api.post("/wallet/analyze", formData);

        if (res.data?.success && res.data.analysis) {
          const fileTxns = res.data.analysis.transactions || [];
          allNewTxns = [...allNewTxns, ...fileTxns];
          totalNewCount += fileTxns.length;
          newFiles.push({ name: file.name, size: file.size, txCount: fileTxns.length });
          toast.success(`${file.name}: ${fileTxns.length} işlem bulundu!`);
        } else {
          setPdfRawText(res.data?.rawTextPreview || "");
          toast.error(`${file.name}: İşlem bulunamadı`);
          newFiles.push({ name: file.name, size: file.size, txCount: 0 });
        }
      } catch (err) {
        console.error(`PDF analysis error (${file.name}):`, err);
        toast.error(`${file.name}: Yükleme hatası`);
        newFiles.push({ name: file.name, size: file.size, txCount: 0 });
      }
    }

    setPdfFiles(newFiles);
    if (totalNewCount > 0) {
      setTransactions(allNewTxns);
      // Run full analysis with all accumulated transactions
      try {
        const res = await api.post("/wallet/analyze-manual", {
          monthlyIncome, transactions: allNewTxns,
        });
        if (res.data?.success) {
          setAnalysisResult(res.data.analysis);
          toast.success(`Toplam ${allNewTxns.length} işlem analiz edildi!`);
        }
      } catch {
        runLocalAnalysis(allNewTxns, monthlyIncome);
      }
    }

    setIsAnalyzing(false);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [monthlyIncome, transactions, pdfFiles, runLocalAnalysis]);

  // Clear all uploaded PDFs
  const clearPdfFiles = useCallback(() => {
    setPdfFiles([]);
    setTransactions([]);
    setAnalysisResult(null);
    setPdfRawText("");
    setPdfError("");
    toast.success("Veriler temizlendi");
  }, []);

  // Load Demo Data
  const loadDemo = useCallback(() => {
    setTransactions(DEMO_TRANSACTIONS);
    runLocalAnalysis(DEMO_TRANSACTIONS, monthlyIncome);
  }, [monthlyIncome, runLocalAnalysis]);

  // Add Manual Entry — calls backend API for persistence
  const addManualEntry = useCallback(async () => {
    setManualEntryError("");
    if (!manualDesc.trim()) {
      setManualEntryError("Açıklama zorunludur.");
      return;
    }
    const parsedAmount = parseFloat(manualAmount.replace(",", "."));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setManualEntryError("Geçerli bir tutar giriniz.");
      return;
    }
    const parsedTotal = parseInt(manualInstallmentTotal) || 1;
    const parsedCurrent = parseInt(manualInstallmentCurrent) || 1;
    if (manualIsInstallment && parsedTotal < 2) {
      setManualEntryError("Taksit sayısı en az 2 olmalıdır.");
      return;
    }

    try {
      const res = await api.post("/transactions", {
        description: manualDesc.trim(),
        amount: parsedAmount,
        type: manualType,
        category: manualType === "income" ? "gelir" : manualCategory,
        isInstallment: manualIsInstallment,
        installmentTotal: parsedTotal,
        installmentCurrent: parsedCurrent,
        date: new Date().toISOString(),
        source: "manual",
      });

      if (res.data?.success) {
        // Reload all transactions from API
        const allRes = await api.get("/transactions");
        if (allRes.data?.success) {
          const txns = allRes.data.transactions;
          setTransactions(txns);
          runLocalAnalysis(txns, monthlyIncome);
        }
        setManualDesc("");
        setManualAmount("");
        setManualIsInstallment(false);
        setManualInstallmentTotal("6");
        setManualInstallmentCurrent("1");
        toast.success(res.data.message || "İşlem eklendi!");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "İşlem eklenemedi.";
      setManualEntryError(msg);
      toast.error(msg);
    }
  }, [manualDesc, manualAmount, manualCategory, manualType, manualIsInstallment, manualInstallmentTotal, manualInstallmentCurrent, monthlyIncome, runLocalAnalysis]);

  // Remove transaction — calls DELETE API
  const removeTx = useCallback(async (idx) => {
    const tx = (analysisResult?.transactions || transactions)[idx];
    try {
      if (tx?._id) {
        // If it's a recurring installment, ask to delete group (handled silently: delete just this one)
        await api.delete(`/transactions/${tx._id}`);
      }
    } catch (err) {
      console.error("Delete error:", err.message);
    }
    const updated = transactions.filter((_, i) => i !== idx);
    setTransactions(updated);
    if (updated.length > 0) runLocalAnalysis(updated, monthlyIncome);
    else setAnalysisResult(null);
  }, [transactions, monthlyIncome, runLocalAnalysis, analysisResult]);

  // Computed values
  const metrics = analysisResult?.metrics;
  const charts = analysisResult?.charts;

  // ─── RENDER ───
  return (
    <div className="flex flex-col h-full w-full bg-[#0a0b10] text-white font-sans overflow-hidden">
      <Toaster position="top-center" toastOptions={{ style: { background: "#1a1d2e", color: "#fff", border: "1px solid rgba(255,255,255,0.05)" } }} />

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-32 lg:pb-8">
        <div className="max-w-6xl mx-auto p-4 lg:p-8 space-y-6">

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* 1. HERO HEADER - Gelir & Upload */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#12141e] via-[#161a28] to-[#0e1018] border border-white/[0.06] p-6 lg:p-8">
            {/* Decorative blurs */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/[0.04] rounded-full blur-[100px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/[0.04] rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

            <div className="relative z-10">
              {/* Top row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center border border-emerald-500/20">
                    <BarChart3 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h1 className="text-xl lg:text-2xl font-black tracking-tight text-white">Finans Analiz Paneli</h1>
                    <p className="text-xs text-zinc-500 font-medium">Kişisel Finansal Mühendislik</p>
                  </div>
                </div>
                <button onClick={() => setShowBalance(!showBalance)} className="p-2 hover:bg-white/5 rounded-xl transition text-zinc-500 hover:text-white">
                  {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>

              {/* Income Input */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <div className="lg:col-span-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-2">
                    <DollarSign size={12} className="inline mr-1" />Aylık Gelir
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">₺</span>
                    <input
                      type="text"
                      value={incomeInput}
                      onChange={(e) => {
                        setIncomeInput(e.target.value);
                        const v = parseFloat(e.target.value.replace(/[^0-9]/g, ""));
                        if (!isNaN(v)) setMonthlyIncome(v);
                      }}
                      className="w-full bg-[#0d0f18] border border-zinc-800 rounded-2xl pl-9 pr-4 py-3.5 text-lg font-bold text-white focus:outline-none focus:border-emerald-500/50 transition"
                      placeholder="35000"
                    />
                  </div>
                </div>

                {/* PDF Upload */}
                <div className="lg:col-span-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-2">
                    <FileText size={12} className="inline mr-1" />Kredi Kartı Ekstresi (PDF)
                  </label>
                  <input ref={fileInputRef} type="file" accept=".pdf" multiple onChange={(e) => handlePdfUpload(e.target.files)} className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed transition-all font-bold text-sm ${pdfFiles.length > 0
                      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                      : "border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-white bg-[#0d0f18]"
                      }`}
                  >
                    <Upload size={18} />
                    {pdfFiles.length > 0 ? `${pdfFiles.length} PDF yüklendi` : "PDF Yükle (Birden fazla)"}
                  </button>
                  {/* Uploaded files list */}
                  {pdfFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {pdfFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] font-medium">
                          <FileText size={10} className="text-emerald-500" />
                          <span className="text-zinc-400 truncate">{f.name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${f.txCount > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                            {f.txCount} işlem
                          </span>
                        </div>
                      ))}
                      <button onClick={clearPdfFiles} className="text-[10px] text-red-400/70 hover:text-red-400 transition flex items-center gap-1 mt-1">
                        <X size={10} /> Tümünü Temizle
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="lg:col-span-1 flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-0">
                    <Zap size={12} className="inline mr-1" />Hızlı Başlat
                  </label>
                  <button
                    onClick={loadDemo}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/20 text-amber-400 font-bold text-sm hover:from-amber-500/30 hover:to-orange-500/20 transition-all"
                  >
                    <Target size={16} /> Demo Verilerle Analiz
                  </button>
                  <button
                    onClick={() => setShowManualEntry(!showManualEntry)}
                    className="flex items-center justify-center gap-2 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 font-semibold text-xs hover:text-white hover:bg-zinc-700/50 transition"
                  >
                    <Plus size={14} /> Manuel İşlem Ekle
                  </button>
                </div>
              </div>

              {/* Manual Entry Form */}
              {showManualEntry && (
                <div className="bg-[#0d0f18] rounded-2xl border border-zinc-800 p-4 mb-4 animate-in slide-in-from-top-2">
                  {/* Income / Expense toggle */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => { setManualType("expense"); setManualEntryError(""); }}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${manualType === "expense"
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                        : "bg-zinc-900 text-zinc-500 border-zinc-700 hover:text-white"
                        }`}
                    >
                      💸 Gider
                    </button>
                    <button
                      onClick={() => { setManualType("income"); setManualEntryError(""); }}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${manualType === "income"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : "bg-zinc-900 text-zinc-500 border-zinc-700 hover:text-white"
                        }`}
                    >
                      💰 Gelir
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <input
                      value={manualDesc}
                      onChange={(e) => { setManualDesc(e.target.value); setManualEntryError(""); }}
                      placeholder="Açıklama (ör: Market, Maaş)"
                      className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                    <input
                      value={manualAmount}
                      onChange={(e) => { setManualAmount(e.target.value); setManualEntryError(""); }}
                      placeholder={manualIsInstallment ? "Toplam tutar (ör: 4000)" : "Tutar (ör: 1500)"}
                      type="number"
                      min="0"
                      className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  {manualType === "expense" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <select
                        value={manualCategory}
                        onChange={(e) => setManualCategory(e.target.value)}
                        className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                      >
                        {Object.entries(CATEGORY_CONFIG).map(([key, c]) => (
                          <option key={key} value={key}>{c.icon} {c.label}</option>
                        ))}
                      </select>

                      {/* Installment toggle */}
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl cursor-pointer hover:border-zinc-600 transition">
                        <input
                          type="checkbox"
                          checked={manualIsInstallment}
                          onChange={(e) => setManualIsInstallment(e.target.checked)}
                          className="w-4 h-4 accent-emerald-500"
                        />
                        <span className="text-sm text-zinc-300 font-medium">💳 Taksitli</span>
                      </label>
                    </div>
                  )}

                  {/* Installment fields */}
                  {manualIsInstallment && manualType === "expense" && (
                    <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block mb-1">Kaçıncı Taksit</label>
                        <input
                          type="number"
                          min="1"
                          value={manualInstallmentCurrent}
                          onChange={(e) => setManualInstallmentCurrent(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block mb-1">Toplam Taksit</label>
                        <input
                          type="number"
                          min="2"
                          value={manualInstallmentTotal}
                          onChange={(e) => setManualInstallmentTotal(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                        />
                      </div>
                      <div className="col-span-2 text-[10px] text-amber-400/70">
                        💡 Toplam tutarı girin. Aylık taksit: ₺{manualAmount && !isNaN(parseFloat(manualAmount)) && parseInt(manualInstallmentTotal) > 1
                          ? (parseFloat(manualAmount) / parseInt(manualInstallmentTotal)).toLocaleString("tr-TR", { maximumFractionDigits: 2 })
                          : "—"} • Gelecek taksitler otomatik oluşturulur.
                      </div>
                    </div>
                  )}

                  {/* Validation error */}
                  {manualEntryError && (
                    <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                      <AlertTriangle size={12} /> {manualEntryError}
                    </div>
                  )}

                  <button
                    onClick={addManualEntry}
                    className={`w-full font-bold rounded-xl px-4 py-2.5 text-sm transition ${manualType === "income"
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-rose-600 hover:bg-rose-500 text-white"
                      }`}
                  >
                    {manualType === "income" ? "+ Gelir Ekle" : manualIsInstallment ? "+ Taksitli Gider Ekle" : "+ Gider Ekle"}
                  </button>
                </div>
              )}

              {/* Summary Cards (shows after analysis) */}
              {metrics && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <SummaryCard title="Toplam Gelir" value={showBalance ? fmt(metrics.monthlyIncome) : "••••"} icon={<TrendingUp size={16} />} color="emerald" />
                  <SummaryCard title="Toplam Gider" value={showBalance ? fmt(metrics.totalExpense) : "••••"} icon={<TrendingDown size={16} />} color="rose" />
                  <SummaryCard title="Net Bakiye" value={showBalance ? (metrics.netBalance >= 0 ? "+" : "") + fmt(metrics.netBalance) : "••••"} icon={<Wallet size={16} />} color={metrics.netBalance >= 0 ? "emerald" : "rose"} />
                  <SummaryCard title="Tasarruf Oranı" value={`%${metrics.gaugeValue}`} icon={<Target size={16} />} color={metrics.gaugeValue >= 20 ? "emerald" : metrics.gaugeValue >= 0 ? "amber" : "rose"} />
                </div>
              )}
            </div>
          </div>

          {/* Loading State */}
          {isAnalyzing && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-zinc-400 font-medium">Finansal analiz yapılıyor...</p>
              </div>
            </div>
          )}

          {/* PDF Debug Panel - Shows when PDF parsing fails */}
          {pdfRawText && !analysisResult && !isAnalyzing && (
            <div className="bg-[#12141e] border border-amber-500/20 rounded-[24px] p-5 lg:p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle size={14} /> PDF Okuma Sonucu
                </h3>
                <button onClick={() => { setPdfRawText(""); setPdfError(""); }} className="text-zinc-500 hover:text-white p-1">
                  <X size={16} />
                </button>
              </div>
              <p className="text-sm text-amber-300/80 mb-3">{pdfError || "PDF'den işlem çıkarılamadı."}</p>
              <p className="text-[11px] text-zinc-500 mb-2">PDF'den okunan ham metin aşağıda gösterilmiştir. İşlemlerinizi görebiliyorsanız, lütfen "Manuel İşlem Ekle" ile ekleyin:</p>
              <pre className="bg-[#0a0b10] border border-zinc-800 rounded-xl p-4 text-[11px] text-zinc-400 font-mono max-h-64 overflow-y-auto whitespace-pre-wrap break-words">
                {pdfRawText}
              </pre>
              <div className="mt-3 flex gap-2">
                <button onClick={() => { setShowManualEntry(true); setPdfRawText(""); }} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition">
                  Manuel İşlem Ekle
                </button>
                <button onClick={loadDemo} className="px-4 py-2 bg-amber-600/20 hover:bg-amber-500/30 text-amber-400 text-xs font-bold rounded-xl border border-amber-500/20 transition">
                  Demo Verilerle Dene
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* DASHBOARD SECTIONS (only show after analysis) */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {analysisResult && !isAnalyzing && (
            <>
              {/* Row 1: Gauge + TreeMap */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* GAUGE CHART */}
                <DashboardCard title="Gelir / Gider Dengesi" icon={<PieIcon size={14} className="text-emerald-400" />}>
                  <GaugeChart value={metrics.gaugeValue} income={metrics.monthlyIncome} expense={metrics.totalExpense} show={showBalance} />
                </DashboardCard>

                {/* TREEMAP - Category Breakdown */}
                <DashboardCard title="Harcama Kategorileri" icon={<BarChart3 size={14} className="text-amber-400" />}>
                  <CategoryTreeMap data={charts.categoryBreakdown} total={metrics.totalExpense} show={showBalance} />
                </DashboardCard>
              </div>

              {/* Row 2: Burn Rate + Heatmap */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <DashboardCard title="Finansal Kontrol Paneli" icon={<Flame size={14} className="text-red-400" />}>
                  <BurnRateMeter data={metrics.burnRate} show={showBalance} topCategory={analysisResult.summary.topCategory} />
                </DashboardCard>

                {/* FINANCIAL HEATMAP */}
                <DashboardCard title="Harcama Isı Haritası" icon={<Calendar size={14} className="text-blue-400" />}>
                  <FinancialHeatmap data={charts.heatmapData} show={showBalance} />
                </DashboardCard>
              </div>

              {/* Row 3: Opportunity Cost */}
              <DashboardCard title="Fırsat Maliyeti Tracker" icon={<ArrowUpRight size={14} className="text-violet-400" />} subtitle={`Aylık İstek Harcaması: ${showBalance ? fmt(metrics.opportunityCost.monthlyLifestyleSpend) : "••••"}`}>
                <OpportunityCostTracker data={metrics.opportunityCost} show={showBalance} />
              </DashboardCard>

              {/* Row 4: Zombie Subscriptions */}
              <DashboardCard title="Zombi Abonelik Denetimi" icon={<Ghost size={14} className="text-purple-400" />} subtitle={`${metrics.zombieSubscriptions.count} şüpheli abonelik tespit edildi`}>
                <ZombieSubscriptionAudit data={metrics.zombieSubscriptions} show={showBalance} />
              </DashboardCard>

              {/* Row 5: Transaction List */}
              <DashboardCard title={`İşlem Listesi (${analysisResult.transactions?.length || 0})`} icon={<FileText size={14} className="text-zinc-400" />}>
                <TransactionList
                  transactions={analysisResult.transactions || transactions}
                  onRemove={removeTx}
                  show={showBalance}
                />
              </DashboardCard>
            </>
          )}

          {/* Empty State */}
          {!analysisResult && !isAnalyzing && (
            <div className="text-center py-24">
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-white/5 flex items-center justify-center">
                <BarChart3 className="w-12 h-12 text-emerald-500/50" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Finansal Analizinizi Başlatın</h2>
              <p className="text-sm text-zinc-500 max-w-md mx-auto mb-6">
                Aylık gelirinizi girin ve kredi kartı ekstresini yükleyin ya da demo verilerle başlayın.
                Yapay zeka değil, finansal mühendislik algoritmaları ile analiz.
              </p>
              <button onClick={loadDemo} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-8 py-3 rounded-2xl transition-all shadow-lg shadow-emerald-600/20">
                <Target size={16} className="inline mr-2" /> Demo ile Keşfet
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function SummaryCard({ title, value, icon, color }) {
  const colors = {
    emerald: "from-emerald-500/15 to-emerald-600/5 border-emerald-500/15 text-emerald-400",
    rose: "from-rose-500/15 to-rose-600/5 border-rose-500/15 text-rose-400",
    amber: "from-amber-500/15 to-amber-600/5 border-amber-500/15 text-amber-400",
    blue: "from-blue-500/15 to-blue-600/5 border-blue-500/15 text-blue-400",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-4`}>
      <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest mb-1 ${colors[color].split(" ").pop()}`}>
        {icon} {title}
      </div>
      <div className="text-xl lg:text-2xl font-black text-white">{value}</div>
    </div>
  );
}

function DashboardCard({ title, icon, subtitle, children }) {
  return (
    <div className="bg-[#12141e] border border-white/[0.05] rounded-[24px] p-5 lg:p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
          {icon} {title}
        </h3>
      </div>
      {subtitle && <p className="text-[11px] text-zinc-600 mb-3">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

// ─── GAUGE CHART ───
function GaugeChart({ value, income, expense, show }) {
  const gaugeData = [
    { name: "Tasarruf", value: Math.max(0, value), fill: value >= 20 ? "#10b981" : value >= 0 ? "#f59e0b" : "#ef4444" },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={gaugeData} barSize={20}>
            <RadialBar background={{ fill: "rgba(255,255,255,0.03)" }} clockWise dataKey="value" cornerRadius={10} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center -mt-16 relative z-10">
        <div className={`text-4xl font-black ${value >= 20 ? "text-emerald-400" : value >= 0 ? "text-amber-400" : "text-red-400"}`}>
          {show ? `%${value}` : "••••"}
        </div>
        <div className="text-xs text-zinc-500 mt-1 font-medium">
          {value >= 20 ? "Sağlıklı Bütçe 💪" : value >= 0 ? "Dikkatli Olun ⚠️" : "Tehlike Bölgesi 🚨"}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-6 w-full">
        <div className="text-center p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Gelir</div>
          <div className="text-lg font-black text-emerald-400">{show ? fmt(income) : "••••"}</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Gider</div>
          <div className="text-lg font-black text-rose-400">{show ? fmt(expense) : "••••"}</div>
        </div>
      </div>
    </div>
  );
}

// ─── CATEGORY TREEMAP ───
function CategoryTreeMap({ data, total, show }) {
  if (!data || data.length === 0) return <div className="text-zinc-600 text-sm">Veri yok</div>;

  return (
    <div className="space-y-3">
      {data.map((cat, idx) => {
        const pct = total > 0 ? ((cat.total / total) * 100).toFixed(1) : 0;
        return (
          <div key={cat.key || idx} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">{cat.icon}</span>
                <span className="text-sm font-bold text-white">{cat.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-zinc-400">{cat.count} işlem</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-white">{show ? fmt(cat.total) : "••••"}</span>
                <span className="text-[10px] font-bold text-zinc-500 ml-2">%{pct}</span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full h-3 bg-white/[0.03] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, backgroundColor: cat.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── HELPER COMPONENTS ───

// ─── BURN RATE METER ───
// ─── BURN RATE METER (Financial Control Panel) ───
function BurnRateMeter({ data, show, topCategory }) {
  if (!data) return null;

  // Calculate additional metrics
  const projectedTotal = data.totalExpense + (data.dailyBurn * data.daysRemaining);
  const remainingBudget = Math.max(0, data.monthlyIncome - data.totalExpense);
  const dailyLimit = data.daysRemaining > 0 ? remainingBudget / data.daysRemaining : 0;

  const metrics = [
    { label: "Günlük Ortalama", value: data.dailyBurn, sub: "Harcama Hızı", color: "text-white" },
    { label: "Tahmini Ay Sonu", value: projectedTotal, sub: "Beklenen Toplam", color: "text-zinc-400" },
    { label: "Kalan Bütçe", value: remainingBudget, sub: "Harcanabilir", color: remainingBudget < 0 ? "text-red-400" : "text-emerald-400" },
    { label: "Günlük Limit", value: dailyLimit, sub: "Hedef", color: "text-blue-400" },
  ];

  return (
    <div className="space-y-4">
      {/* Main Grid */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m, i) => (
          <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] relative overflow-hidden group hover:bg-white/[0.05] transition">
            <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1">{m.label}</div>
            <div className={`text-lg lg:text-xl font-black ${m.color}`}>
              {show ? fmt(m.value) : "••••"}
            </div>
            <div className="text-[9px] text-zinc-600 font-medium mt-1">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Secondary Info */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/5 border border-purple-500/10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400"><TrendingUp size={12} /></div>
          <div>
            <div className="text-[10px] text-zinc-400 font-bold">En Yüksek Kategori</div>
            <div className="text-xs font-bold text-white">{topCategory || "N/A"}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-zinc-400 font-bold">Tasarruf Oranı</div>
          <div className={`text-sm font-black ${data.savingsRate >= 20 ? "text-emerald-400" : data.savingsRate >= 0 ? "text-amber-400" : "text-red-400"}`}>%{data.savingsRate}</div>
        </div>
      </div>
    </div>
  );
}

// ─── FINANCIAL HEATMAP ───
function FinancialHeatmap({ data, show }) {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const stats = data || [];

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-indexed
  const months = [
    { id: 1, name: "Ocak" }, { id: 2, name: "\u015eubat" }, { id: 3, name: "Mart" },
    { id: 4, name: "Nisan" }, { id: 5, name: "May\u0131s" }, { id: 6, name: "Haziran" },
    { id: 7, name: "Temmuz" }, { id: 8, name: "A\u011fustos" }, { id: 9, name: "Eyl\u00fcl" },
    { id: 10, name: "Ekim" }, { id: 11, name: "Kas\u0131m" }, { id: 12, name: "Aral\u0131k" }
  ];

  const monthsData = months.map(m => {
    const found = stats.find(d => d.month.endsWith(`-${String(m.id).padStart(2, '0')}`));
    // Real days in month using JS Date (handles leap years automatically)
    const daysInMonth = new Date(currentYear, m.id, 0).getDate();
    return {
      ...m,
      daysInMonth,
      data: found || { totalSpend: 0, days: [] }
    };
  });

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {monthsData.map((m) => {
          const days = m.data.days || [];
          const isFuture = m.id > currentMonth && currentYear === new Date().getFullYear();
          const opacityClass = isFuture ? "opacity-30 grayscale pointer-events-none" : "hover:border-emerald-500/30 cursor-pointer";

          return (
            <div
              key={m.id}
              onClick={() => !isFuture && setSelectedMonth(m)}
              className={`bg-zinc-900/50 p-3 rounded-xl border border-white/5 transition-all ${opacityClass} group`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-300 group-hover:text-emerald-400 transition">{m.name}</span>
                <span className="text-[10px] text-zinc-500">{m.data.totalSpend > 0 && show ? fmt(m.data.totalSpend) : ""}</span>
              </div>
              <div className="grid gap-0.5" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
                {["Pt", "Sa", "\u00c7a", "Pe", "Cu", "Ct", "Pz"].map((d) => (
                  <div key={d} className="text-center text-[6px] font-bold text-zinc-600 uppercase pb-0.5">{d}</div>
                ))}
                {/* Only render real days in month, no padding beyond */}
                {Array.from({ length: m.daysInMonth }, (_, i) => i + 1).map((dayNum) => {
                  const dayData = days.find(d => d.day === dayNum) || { total: 0, intensity: 0 };
                  let bg = "bg-zinc-800/40";
                  if (dayData.total > 0) {
                    if (dayData.intensity > 0.8) bg = "bg-red-500";
                    else if (dayData.intensity > 0.6) bg = "bg-orange-500";
                    else if (dayData.intensity > 0.4) bg = "bg-amber-500";
                    else if (dayData.intensity > 0.2) bg = "bg-emerald-600";
                    else bg = "bg-emerald-900";
                  }
                  return <div key={dayNum} className={`aspect-square rounded-sm ${bg}`} />;
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-4">
        <span className="text-[9px] text-zinc-600">Az</span>
        {["bg-emerald-900", "bg-emerald-600", "bg-amber-500", "bg-orange-500", "bg-red-500"].map((c, i) => (
          <div key={i} className={`w-4 h-4 rounded ${c}`} />
        ))}
        <span className="text-[9px] text-zinc-600">\u00c7ok</span>
      </div>

      {/* Detail Modal */}
      {selectedMonth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedMonth(null)}>
          <div className="bg-[#12141e] border border-white/10 rounded-3xl w-full max-w-2xl p-6 lg:p-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedMonth(null)}
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition"
            >
              <X size={20} />
            </button>

            <div className="mb-6 flex items-baseline justify-between">
              <div>
                <h3 className="text-2xl font-black text-white mb-1">{selectedMonth.name} Harcama Analizi</h3>
                <p className="text-sm text-zinc-500">{selectedMonth.daysInMonth} g\u00fcnl\u00fck harcama yo\u011funlu\u011fu</p>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Toplam Harcama</div>
                <div className="text-3xl font-black text-emerald-400">{show ? fmt(selectedMonth.data.totalSpend) : "\u2022\u2022\u2022\u2022"}</div>
              </div>
            </div>

            {/* Large Grid — real days only */}
            <div className="bg-black/40 rounded-2xl p-6 border border-white/5 mb-6">
              <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
                {["Pazartesi", "Sal\u0131", "\u00c7ar\u015famba", "Per\u015fembe", "Cuma", "Cumartesi", "Pazar"].map((d) => (
                  <div key={d} className="text-center text-[10px] font-bold text-zinc-500 uppercase pb-2">{d}</div>
                ))}
                {Array.from({ length: selectedMonth.daysInMonth }, (_, i) => i + 1).map((dayNum) => {
                  const days = selectedMonth.data.days || [];
                  const d = days.find(x => x.day === dayNum) || { day: dayNum, total: 0, count: 0, intensity: 0, transactions: [] };
                  let bg = "bg-zinc-800/30";
                  let border = "border border-white/5";
                  if (d.total > 0) {
                    border = "border border-black/20";
                    if (d.intensity > 0.8) bg = "bg-red-500";
                    else if (d.intensity > 0.6) bg = "bg-orange-500";
                    else if (d.intensity > 0.4) bg = "bg-amber-500";
                    else if (d.intensity > 0.2) bg = "bg-emerald-600";
                    else bg = "bg-emerald-900";
                  }
                  return (
                    <div
                      key={dayNum}
                      className={`aspect-square rounded-xl ${bg} ${border} flex flex-col items-center justify-center relative group hover:scale-105 transition-transform z-0 hover:z-10`}
                    >
                      <span className={`text-[10px] font-bold ${d.total > 0 ? "text-white/90" : "text-white/20"}`}>{d.day}</span>
                      {d.total > 0 && (
                        <div className="mt-1 text-[9px] font-bold text-white shadow-sm bg-black/20 px-1.5 rounded-full">
                          {show ? fmt(d.total) : "***"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-zinc-500">
                Bu ay toplam <span className="text-white font-bold">{selectedMonth.data.days?.reduce((a, b) => a + b.count, 0) || 0} i\u015flem</span> yap\u0131ld\u0131.
                En yo\u011fun harcama g\u00fcn\u00fc: <span className="text-white font-bold">{
                  selectedMonth.data.days?.length > 0
                    ? selectedMonth.data.days.reduce((a, b) => a.total > b.total ? a : b).day
                    : "-"
                }. g\u00fcn</span>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── OPPORTUNITY COST TRACKER (Real Prices) ───
function OpportunityCostTracker({ data, show }) {
  const [selectedYear, setSelectedYear] = useState("year5");
  const yearLabels = { year1: "1 Yıl", year5: "5 Yıl", year10: "10 Yıl" };

  if (!data?.projections) return null;

  return (
    <div>
      {/* Info: monthly savings = 20% of income */}
      <div className="mb-4 p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
        <p className="text-[11px] text-emerald-400/80 font-medium text-center">
          💰 Gelirinizin %20'si olan aylık {show ? fmt(data.monthlySavings) : "••••"} tasarruf ile hesaplanmıştır.
        </p>
      </div>

      {/* Year selector */}
      <div className="flex gap-2 mb-5">
        {Object.entries(yearLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelectedYear(key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedYear === key
              ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
              : "bg-white/[0.02] text-zinc-500 border border-white/[0.04] hover:text-white"
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Projections Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.entries(data.projections).map(([key, proj]) => {
          const yearData = proj[selectedYear];
          if (!yearData) return null;
          return (
            <div key={key} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5 text-center hover:border-violet-500/20 transition-all group">
              <div className="text-2xl mb-1">{proj.icon}</div>
              <div className="text-sm font-bold text-white mb-0.5">{proj.label}</div>
              <div className="text-[10px] text-zinc-500 mb-1">Gerçek getiri: {yearData.annualReturn}/yıl</div>
              {yearData.priceOld && yearData.priceNow && (
                <div className="text-[9px] text-zinc-600 mb-3">
                  ${yearData.priceOld} → ${yearData.priceNow}
                </div>
              )}

              <div className="text-2xl font-black text-violet-400 mb-1">
                {show ? fmt(yearData.futureValue) : "••••"}
              </div>
              <div className="text-[10px] text-emerald-500 font-bold">
                +{show ? fmt(yearData.totalGain) : "••"} kazanç
              </div>
              <div className="text-[10px] text-zinc-600 mt-1">
                Toplam yatırım: {show ? fmt(yearData.totalInvested) : "••"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-violet-500/5 border border-violet-500/10 rounded-xl">
        <p className="text-[11px] text-violet-400/80 font-medium text-center">
          💡 Aylık gelirinizin %20'sini ({show ? fmt(data.monthlySavings) : "••••"}) S&P 500'e yatırsaydınız,
          {" "}{yearLabels[selectedYear]} sonunda {show ? fmt(data.projections.sp500?.[selectedYear]?.futureValue || 0) : "••••"} biriktirirdiniz.
        </p>
      </div>
    </div>
  );
}

// ─── ZOMBIE SUBSCRIPTION AUDIT ───
function ZombieSubscriptionAudit({ data, show }) {
  if (!data) return null;

  const severityConfig = {
    high: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", label: "Yüksek" },
    medium: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", label: "Orta" },
    low: { bg: "bg-zinc-500/10", border: "border-zinc-500/20", text: "text-zinc-400", label: "Düşük" },
  };

  if (data.zombies.length === 0) {
    return (
      <div className="text-center py-8">
        <Ghost className="w-10 h-10 mx-auto text-zinc-700 mb-2" />
        <div className="text-sm text-zinc-500 font-medium">Zombi abonelik bulunamadı! 🎉</div>
        <div className="text-[10px] text-zinc-600">Mükerrer küçük tutarlı işlem tespit edilmedi.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-purple-400" />
          <span className="text-xs font-bold text-purple-400">Potansiyel Tasarruf</span>
        </div>
        <div className="text-right">
          <span className="text-sm font-black text-white">{show ? fmt(data.totalMonthlyWaste) : "••"}/ay</span>
          <span className="text-[10px] text-zinc-500 ml-2">({show ? fmt(data.totalYearlyWaste) : "••"}/yıl)</span>
        </div>
      </div>

      {/* Zombie list */}
      {data.zombies.map((z, idx) => {
        const sev = severityConfig[z.severity] || severityConfig.low;
        return (
          <div key={idx} className={`flex items-center justify-between p-3 rounded-xl ${sev.bg} border ${sev.border}`}>
            <div className="flex items-center gap-3">
              <Ghost size={18} className={sev.text} />
              <div>
                <div className="text-sm font-bold text-white">{z.description}</div>
                <div className="text-[10px] text-zinc-500">{z.frequency}x tekrar • {sev.label} risk</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-white">{show ? fmt(z.monthlyWaste) : "••"}/ay</div>
              <div className="text-[10px] text-zinc-500">{show ? fmt(z.yearlyWaste) : "••"}/yıl</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── TRANSACTION LIST ───
function TransactionList({ transactions, onRemove, show }) {
  const [expanded, setExpanded] = useState(false);
  const displayed = expanded ? transactions : transactions.slice(0, 8);

  return (
    <div className="space-y-2">
      {displayed.map((t, idx) => {
        const isIncome = t.type === "income";
        const cat = CATEGORY_CONFIG[t.category] || { label: "Di\u011fer", color: "#999", icon: isIncome ? "\ud83d\udcb0" : "\ud83d\udce6" };
        return (
          <div key={t._id || idx} className="group flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-all">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: (isIncome ? "#10b981" : cat.color) + "15" }}>
              {isIncome ? "\ud83d\udcb0" : cat.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white truncate">{t.description}</span>
                {t.isInstallment && t.installmentCurrent && (
                  <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/20">
                    {t.installmentTotal
                      ? `${t.installmentCurrent}/${t.installmentTotal}`
                      : `${t.installmentCurrent}.Taksit`}
                  </span>
                )}
                {isIncome && (
                  <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                    Gelir
                  </span>
                )}
              </div>
              <div className="text-[10px] text-zinc-500">
                {isIncome ? "Gelir" : (t.categoryLabel || cat.label)} {"\u2022"} {new Date(t.date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                {t.isInstallment && t.totalAmount && (
                  <span className="ml-1 text-amber-400/70">{"\u2022"} Toplam: {fmt(t.totalAmount)}</span>
                )}
                {t.isInstallment && !t.totalAmount && (
                  <span className="ml-1 text-amber-400/70">{"\u2022"} Taksitli ödeme</span>
                )}
              </div>
            </div>
            <div className={`text-sm font-black ${isIncome ? "text-emerald-400" : "text-rose-400"}`}>
              {show ? `${isIncome ? "+" : "-"}${fmt(t.amount)}` : "\u2022\u2022"}
            </div>
            <button onClick={() => onRemove(idx)} className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-red-400 rounded-lg transition-all">
              <Trash2 size={14} />
            </button>
          </div>
        );
      })}

      {transactions.length > 8 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-center py-2 text-xs font-bold text-zinc-500 hover:text-white transition flex items-center justify-center gap-1"
        >
          {expanded ? <><ChevronUp size={14} /> Daha Az</> : <><ChevronDown size={14} /> {transactions.length - 8} i\u015flem daha</>}
        </button>
      )}
    </div>
  );
}

export default WalletPage;
