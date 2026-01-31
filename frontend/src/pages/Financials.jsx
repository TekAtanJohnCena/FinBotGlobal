import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from "../lib/api";
import { formatTicker } from '../lib/tickerUtils';
import {
    ArrowLeft,
    Download,
    Activity,
    Info,
    ChevronDown,
    Lock,
    Sparkles,
    FileSpreadsheet,
    FileText
} from 'lucide-react';

// Türkçe Mali Kalem Eşleştirmesi
const TURKISH_LABELS = {
    // Gelir Tablosu
    revenue: "Toplam Gelir",
    costOfRevenue: "Satışların Maliyeti",
    grossProfit: "Brüt Kâr",
    opExpenses: "Faaliyet Giderleri",
    ebitda: "FAVÖK",
    netIncome: "Net Kâr",
    // Bilanço
    cashAndEquivalents: "Nakit ve Benzerleri",
    totalAssets: "Toplam Varlıklar",
    totalLiabilities: "Toplam Borçlar",
    longTermDebt: "Uzun Vadeli Borç",
    totalEquity: "Toplam Özkaynak",
    // Nakit Akışı
    netCashProvidedByOperatingActivities: "İşletme Nakit Akışı",
    netCashUsedForInvestingActivities: "Yatırım Nakit Akışı",
    netCashUsedProvidedByFinancingActivities: "Finansman Nakit Akışı",
    netChangeInCash: "Net Nakit Değişimi",
    // Temettü
    exDate: "Temettü Tarihi (Ex-Date)",
    paymentDate: "Ödeme Tarihi",
    recordDate: "Kayıt Tarihi",
    amount: "Dağıtım (Miktar)",
    frequency: "Sıklık"
};

// Plan bazlı yıl limitleri (PRO = 999 means unlimited)
const PLAN_YEAR_LIMITS = {
    FREE: 5,
    PLUS: 10,
    PRO: 999  // Unlimited - show all available data
};

const Financials = () => {
    const { symbol } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("Income Statement");
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const [userPlan, setUserPlan] = useState('FREE');
    const [yearLimit, setYearLimit] = useState(5);

    // Kullanıcı planını al
    useEffect(() => {
        const fetchUserPlan = async () => {
            try {
                const response = await api.get('/user/quota');
                if (response.data.ok) {
                    const plan = response.data.data.plan || 'FREE';
                    setUserPlan(plan);
                    setYearLimit(PLAN_YEAR_LIMITS[plan] || 5);
                }
            } catch (err) {
                console.log('Could not fetch user plan, using FREE limits');
            }
        };
        fetchUserPlan();
    }, []);

    useEffect(() => {
        const fetchFinancials = async () => {
            setLoading(true);
            try {
                // Format ticker before API call
                const formattedSymbol = formatTicker(symbol);
                const response = await api.get(`/stock-analysis/${formattedSymbol}`);
                if (response.data.ok) {
                    // Sort history by date DESCENDING (Newest -> Oldest) for the table
                    const sortedHistory = (response.data.data.financials.history || []).sort((a, b) =>
                        new Date(b.date) - new Date(a.date)
                    );
                    setData({ ...response.data.data, financials: { ...response.data.data.financials, history: sortedHistory } });
                } else {
                    setError("Mali veriler yüklenemedi.");
                }
            } catch (err) {
                setError("Sunucu bağlantı hatası.");
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
                { label: TURKISH_LABELS.revenue, key: "revenue" },
                { label: TURKISH_LABELS.costOfRevenue, key: "costOfRevenue" },
                { label: TURKISH_LABELS.grossProfit, key: "grossProfit", bold: true },
                { label: TURKISH_LABELS.opExpenses, key: "opExpenses" },
                { label: TURKISH_LABELS.ebitda, key: "ebitda", bold: true },
                { label: TURKISH_LABELS.netIncome, key: "netIncome", bold: true, color: "text-emerald-400" },
            ];
        } else if (activeTab === "Balance Sheet") {
            return [
                { label: TURKISH_LABELS.cashAndEquivalents, key: "cashAndEquivalents" },
                { label: TURKISH_LABELS.totalAssets, key: "totalAssets", bold: true },
                { label: TURKISH_LABELS.totalLiabilities, key: "totalLiabilities", bold: true },
                { label: TURKISH_LABELS.longTermDebt, key: "longTermDebt" },
                { label: TURKISH_LABELS.totalEquity, key: "totalEquity", bold: true, color: "text-blue-400" },
            ];
        } else if (activeTab === "Dividends") {
            return [
                { label: TURKISH_LABELS.exDate, key: "exDate" },
                { label: TURKISH_LABELS.paymentDate, key: "paymentDate" },
                { label: TURKISH_LABELS.recordDate, key: "recordDate" },
                { label: TURKISH_LABELS.amount, key: "distributionAmount", bold: true, color: "text-emerald-400" }, // specific key handling needed?
                { label: TURKISH_LABELS.frequency, key: "frequency" },
            ];
        } else {
            return [
                { label: TURKISH_LABELS.netCashProvidedByOperatingActivities, key: "netCashProvidedByOperatingActivities" },
                { label: TURKISH_LABELS.netCashUsedForInvestingActivities, key: "netCashUsedForInvestingActivities" },
                { label: TURKISH_LABELS.netCashUsedProvidedByFinancingActivities, key: "netCashUsedProvidedByFinancingActivities" },
                { label: TURKISH_LABELS.netChangeInCash, key: "netChangeInCash", bold: true, color: "text-indigo-400" },
            ];
        }
    };

    // CSV Export fonksiyonu
    const exportToCSV = useCallback((type) => {
        if (!data?.financials?.history) return;

        const history = data.financials.history.slice(0, yearLimit);
        let rows = [];
        let filename = '';

        if (type === 'income') {
            rows = getIncomeRows();
            filename = `${symbol}_gelir_tablosu.csv`;
        } else if (type === 'balance') {
            rows = getBalanceRows();
            filename = `${symbol}_bilanco.csv`;
        } else if (type === 'cashflow') {
            rows = getCashFlowRows();
            filename = `${symbol}_nakit_akisi.csv`;
        }

        // CSV header
        const headers = ['Kalem', ...history.map(h => h.year || new Date(h.date).getFullYear())];
        let csvContent = headers.join(',') + '\n';

        // CSV rows
        rows.forEach(row => {
            const values = [row.label, ...history.map(h => h[row.key] || 0)];
            csvContent += values.join(',') + '\n';
        });

        // Download
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setExportMenuOpen(false);
    }, [data, yearLimit, symbol]);

    const getIncomeRows = () => [
        { label: TURKISH_LABELS.revenue, key: "revenue" },
        { label: TURKISH_LABELS.costOfRevenue, key: "costOfRevenue" },
        { label: TURKISH_LABELS.grossProfit, key: "grossProfit" },
        { label: TURKISH_LABELS.opExpenses, key: "opExpenses" },
        { label: TURKISH_LABELS.ebitda, key: "ebitda" },
        { label: TURKISH_LABELS.netIncome, key: "netIncome" },
    ];

    const getBalanceRows = () => [
        { label: TURKISH_LABELS.cashAndEquivalents, key: "cashAndEquivalents" },
        { label: TURKISH_LABELS.totalAssets, key: "totalAssets" },
        { label: TURKISH_LABELS.totalLiabilities, key: "totalLiabilities" },
        { label: TURKISH_LABELS.longTermDebt, key: "longTermDebt" },
        { label: TURKISH_LABELS.totalEquity, key: "totalEquity" },
    ];

    const getCashFlowRows = () => [
        { label: TURKISH_LABELS.netCashProvidedByOperatingActivities, key: "netCashProvidedByOperatingActivities" },
        { label: TURKISH_LABELS.netCashUsedForInvestingActivities, key: "netCashUsedForInvestingActivities" },
        { label: TURKISH_LABELS.netCashUsedProvidedByFinancingActivities, key: "netCashUsedProvidedByFinancingActivities" },
        { label: TURKISH_LABELS.netChangeInCash, key: "netChangeInCash" },
    ];

    if (loading) return (
        <div className="min-h-screen bg-[#0f111a] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-[10px]">Mali Tablolar Yükleniyor...</p>
            </div>
        </div>
    );

    if (error || !data) return (
        <div className="min-h-screen bg-[#0f111a] flex items-center justify-center p-6 text-center">
            <div>
                <h2 className="text-2xl font-black text-rose-500 mb-2">Hata</h2>
                <p className="text-slate-400">{error || "Bu sembol için mali veri bulunamadı."}</p>
                <button onClick={() => navigate(-1)} className="mt-6 px-6 py-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors font-bold text-sm">Geri Dön</button>
            </div>
        </div>
    );

    const history = (data?.financials?.history || []).slice(0, yearLimit);
    const fullHistory = data?.financials?.history || [];
    const hasMoreData = fullHistory.length > yearLimit;
    const rows = getRows();

    return (
        <div className="min-h-screen bg-[#0f111a] text-white font-sans selection:bg-indigo-500/30">
            {/* HEADER */}
            <div className="border-b border-slate-800/60 bg-[#0f111a]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-3 md:py-0 md:h-20 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
                    <div className="flex items-center gap-3 md:gap-6">
                        <button
                            onClick={() => navigate(`/screener/${formatTicker(symbol)}`)}
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
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Piyasa Değeri</span>
                            <span className="text-sm font-black text-slate-200">{formatNumber(data?.fundamentals?.marketCap)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">F/K Oranı</span>
                            <span className="text-sm font-black text-slate-200">{data?.fundamentals?.peRatio?.toFixed(2) || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Temettü Verimi</span>
                            <span className="text-sm font-black text-emerald-400">{data?.fundamentals?.dividendYield ? `%${(data.fundamentals.dividendYield * 100).toFixed(2)}` : "—"}</span>
                        </div>
                    </div>

                    {/* EXPORT BUTTON */}
                    <div className="hidden md:flex items-center gap-4 relative">
                        <button
                            onClick={() => setExportMenuOpen(!exportMenuOpen)}
                            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-2.5 rounded-xl transition-all font-bold text-xs shadow-lg shadow-indigo-500/20"
                        >
                            <Download size={16} />
                            İndir
                            <ChevronDown size={14} className={`transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Export Dropdown */}
                        {exportMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-56 bg-[#1e222d] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                                <div className="p-2">
                                    <button
                                        onClick={() => exportToCSV('income')}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 rounded-lg transition-colors text-left"
                                    >
                                        <FileSpreadsheet size={16} className="text-emerald-400" />
                                        <div>
                                            <div className="text-sm font-bold text-slate-200">Gelir Tablosu</div>
                                            <div className="text-[10px] text-slate-500">CSV formatında indir</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => exportToCSV('balance')}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 rounded-lg transition-colors text-left"
                                    >
                                        <FileText size={16} className="text-blue-400" />
                                        <div>
                                            <div className="text-sm font-bold text-slate-200">Bilanço</div>
                                            <div className="text-[10px] text-slate-500">CSV formatında indir</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => exportToCSV('cashflow')}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 rounded-lg transition-colors text-left"
                                    >
                                        <Activity size={16} className="text-indigo-400" />
                                        <div>
                                            <div className="text-sm font-bold text-slate-200">Nakit Akışı</div>
                                            <div className="text-[10px] text-slate-500">CSV formatında indir</div>
                                        </div>
                                    </button>
                                </div>
                                <div className="border-t border-slate-700 px-3 py-2 bg-slate-800/30">
                                    <div className="text-[9px] text-slate-500 uppercase font-bold">
                                        Plan limitiniz: {yearLimit} yıl veri
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto p-4 md:p-8">
                {/* Plan Limit Banner */}
                {hasMoreData && userPlan === 'FREE' && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                                <Lock size={18} className="text-amber-400" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-amber-200">Daha fazla yıl verisi mevcut!</div>
                                <div className="text-xs text-amber-400/70">Free plan: {yearLimit} yıl • Plus: 10 yıl • Pro: 25+ yıl</div>
                            </div>
                        </div>
                        <Link
                            to="/pricing"
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-bold text-xs hover:from-amber-400 hover:to-orange-400 transition-all"
                        >
                            <Sparkles size={14} />
                            Yükselt
                        </Link>
                    </div>
                )}

                {/* NAVIGATION / TABS */}
                <div className="flex flex-col gap-4 md:gap-6 mb-6 md:mb-10">
                    <div className="overflow-x-auto pb-2 md:pb-0">
                        <div className="flex p-1 md:p-1.5 bg-[#1e222d] border border-slate-800/50 rounded-xl md:rounded-2xl shadow-inner w-fit min-w-full md:min-w-0">
                            {["Income Statement", "Balance Sheet", "Cash Flow", "Dividends"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 md:flex-none px-3 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl font-black text-[10px] md:text-xs uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab
                                        ? 'bg-[#0f111a] text-white shadow-lg border border-slate-700/50'
                                        : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    {tab === "Income Statement" ? "Gelir Tablosu" :
                                        tab === "Balance Sheet" ? "Bilanço" :
                                            tab === "Cash Flow" ? "Nakit Akışı" : "Temettü"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-500/5 border border-indigo-500/10 rounded-xl w-fit">
                        <Info size={14} className="text-indigo-400/80" />
                        <span className="text-[10px] font-bold text-indigo-400/80 uppercase tracking-widest">
                            Görüntülenen: {history.length} Yıl • Plan: {userPlan === 'FREE' ? 'Ücretsiz' : userPlan === 'PLUS' ? 'Plus' : 'Pro'} {userPlan === 'PRO' && '(Sınırsız)'}
                        </span>
                    </div>
                </div>

                {activeTab === "Dividends" ? (
                    <div>
                        {/* WRAPPER FOR DIVIDENDS TAB CONTENT */}
                        <div className="bg-[#1e222d] border border-slate-800 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead>
                                        <tr className="bg-[#242835] border-b border-slate-800">
                                            <th className="px-4 md:px-8 py-4 md:py-6 text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500">Temettü Tarihi (Ex-Date)</th>
                                            <th className="px-4 md:px-8 py-4 md:py-6 text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500">Ödeme Tarihi</th>
                                            <th className="px-4 md:px-8 py-4 md:py-6 text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500">Kayıt Tarihi</th>
                                            <th className="px-4 md:px-8 py-4 md:py-6 text-right text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500">Dağıtım (Miktar)</th>
                                            <th className="px-4 md:px-8 py-4 md:py-6 text-right text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500">Sıklık</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/40">
                                        {(data?.dividends || []).length > 0 ? (
                                            (data.dividends || []).slice(0, yearLimit * 4).map((div, idx) => (
                                                // Assuming approx 4 dividends per year for yearLimit calculation or just show recent
                                                <tr key={idx} className={`hover:bg-indigo-500/5 transition-colors ${idx % 2 === 0 ? 'bg-[#1e222d]' : 'bg-[#191d29]'}`}>
                                                    <td className="px-4 md:px-8 py-4 md:py-5 text-xs md:text-sm font-bold text-slate-300">
                                                        {new Date(div.exDate).toLocaleDateString('tr-TR')}
                                                    </td>
                                                    <td className="px-4 md:px-8 py-4 md:py-5 text-xs md:text-sm font-medium text-slate-400">
                                                        {new Date(div.paymentDate).toLocaleDateString('tr-TR')}
                                                    </td>
                                                    <td className="px-4 md:px-8 py-4 md:py-5 text-xs md:text-sm font-mono text-slate-500">
                                                        {new Date(div.recordDate).toLocaleDateString('tr-TR')}
                                                    </td>
                                                    <td className="px-4 md:px-8 py-4 md:py-5 text-right font-mono text-sm font-black text-emerald-400">
                                                        ${div.amount || div.distributionAmount}
                                                    </td>
                                                    <td className="px-4 md:px-8 py-4 md:py-5 text-right text-xs font-black uppercase text-indigo-400">
                                                        {div.frequency === 'Q' ? 'Çeyreklik' : div.frequency === 'A' ? 'Yıllık' : div.frequency === 'M' ? 'Aylık' : div.frequency}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-8 py-10 text-center text-slate-500 font-bold">
                                                    Bu şirket için temettü geçmişi bulunamadı.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* SPLITS SECTION */}
                        <div className="mt-8">
                            <div className="flex items-center gap-2 mb-4">
                                <h3 className="text-sm md:text-base font-black uppercase tracking-wide text-indigo-400">Hisse Bölünmeleri (Splits)</h3>
                                <div className="h-[1px] flex-1 bg-slate-800"></div>
                            </div>

                            {data?.splits && data.splits.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {data.splits.map((split, i) => (
                                        <div key={i} className="bg-[#1e222d] border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-lg hover:border-indigo-500/30 transition-colors">
                                            <div>
                                                <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Bölünme Tarihi</div>
                                                <div className="text-sm font-bold text-slate-200">{new Date(split.exDate).toLocaleDateString('tr-TR')}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Oran</div>
                                                <div className="text-lg font-black font-mono text-emerald-400">
                                                    {split.splitFactor ?
                                                        // Convert "0.2" to "5:1" or similar if possible, but Tiingo sends float ratio.
                                                        // E.g. A 4-for-1 split is 0.25 on old price or 4.0? 
                                                        // Tiingo docs: "numerator/denominator", e.g. 2-for-1 is 0.5? Check Tiingo specs.
                                                        // Usually split factor is presented as X:Y.
                                                        // Let's display raw factor and maybe strict logic if known.
                                                        // Tiingo: "The split factor 1/splitRatio" e.g. 2:1 split is 0.5?
                                                        // Actually Tiingo says "splitFactor".
                                                        // Let's just show it. 
                                                        // If factor < 1, e.g. 0.25 (4:1 split).
                                                        // If factor > 1, e.g. 2 (Reverse Split 1:2)

                                                        // Simple display:
                                                        split.splitFactor < 1 ? `1:${1 / split.splitFactor}` : `${split.splitFactor}:1`
                                                        : "—"
                                                    }
                                                </div>
                                                <div className="text-[9px] font-bold text-slate-500 mt-0.5">
                                                    Çarpan: {split.splitFactor}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-center text-slate-500 font-bold border border-slate-800 rounded-xl bg-[#1e222d]/50 border-dashed">
                                    Geçmiş bölünme verisi bulunmuyor.
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#1e222d] border border-slate-800 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="bg-[#242835] border-b border-slate-800">
                                        <th className="px-4 md:px-8 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 sticky left-0 bg-[#242835] z-20 min-w-[160px] md:min-w-[280px] shadow-[4px_0_10px_-2px_rgba(0,0,0,0.4)]">
                                            Mali Kalemler (USD)
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
                                            {history.map((stmt, i) => {
                                                const val = stmt[row.key];
                                                const isNeg = val < 0;

                                                // Calculate YoY Change
                                                let pctChange = null;
                                                const prevYearStmt = history[i + 1]; // Previous year (since sorted descending)
                                                if (prevYearStmt) {
                                                    const prevVal = prevYearStmt[row.key];
                                                    if (prevVal && prevVal !== 0) {
                                                        pctChange = ((val - prevVal) / Math.abs(prevVal)) * 100;
                                                    }
                                                }

                                                return (
                                                    <td
                                                        key={stmt.date}
                                                        className={`px-4 md:px-10 py-3 md:py-5 text-right font-mono text-xs md:text-sm ${row.bold ? 'text-slate-100 font-bold' : 'text-slate-400'} 
                                                        ${isNeg ? 'text-rose-400' : ''} group relative`}
                                                    >
                                                        <div className="flex items-center justify-end gap-2">
                                                            {formatNumber(val)}

                                                            {/* Percentage Change Badge (Visible on Row Hover) */}
                                                            {pctChange !== null && Math.abs(pctChange) > 0.01 && (
                                                                <span className={`
                                                                opacity-0 group-hover:opacity-100 transition-opacity duration-300
                                                                text-[9px] font-black px-1.5 py-0.5 rounded-md
                                                                ${pctChange > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}
                                                            `}>
                                                                    {pctChange > 0 ? '+' : ''}{pctChange.toFixed(1)}%
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
                }

                {/* Mobile Export Button */}
                <div className="md:hidden mt-6">
                    <button
                        onClick={() => setExportMenuOpen(!exportMenuOpen)}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-xl font-bold text-sm"
                    >
                        <Download size={18} />
                        Verileri İndir
                    </button>
                    {exportMenuOpen && (
                        <div className="mt-2 bg-[#1e222d] border border-slate-700 rounded-xl overflow-hidden">
                            <button onClick={() => exportToCSV('income')} className="w-full px-4 py-3 text-left text-sm font-bold text-slate-200 hover:bg-slate-800 border-b border-slate-700">
                                📊 Gelir Tablosu (CSV)
                            </button>
                            <button onClick={() => exportToCSV('balance')} className="w-full px-4 py-3 text-left text-sm font-bold text-slate-200 hover:bg-slate-800 border-b border-slate-700">
                                📋 Bilanço (CSV)
                            </button>
                            <button onClick={() => exportToCSV('cashflow')} className="w-full px-4 py-3 text-left text-sm font-bold text-slate-200 hover:bg-slate-800">
                                💵 Nakit Akışı (CSV)
                            </button>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[9px] text-slate-600 font-bold uppercase tracking-widest bg-[#161a24] p-6 rounded-2xl border border-slate-800/40">
                    <div className="flex items-center gap-4">
                        <span>© 2026 FinBot Global</span>
                        <div className="hidden sm:block w-1 h-1 bg-slate-800 rounded-full"></div>
                        <span className="text-slate-500">Kaynak: Tiingo Professional Data</span>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-500/80">
                        <Activity size={14} />
                        <span>Gerçek zamanlı veri</span>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Financials;
