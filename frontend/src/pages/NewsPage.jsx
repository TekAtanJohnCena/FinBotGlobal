import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from "../lib/api";
import QuotaDisplay from '../components/QuotaDisplay';
import {
    Newspaper,
    RefreshCw,
    ExternalLink,
    Clock,
    Globe,
    Sparkles,
    TrendingUp,
    TrendingDown,
    Minus,
    Loader2,
    ChevronRight,
    Filter,
    Building2,
    Calendar,
    Search,
    X,
    AlertTriangle
} from 'lucide-react';

const NewsPage = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStock, setSelectedStock] = useState(null);
    const [analyzingId, setAnalyzingId] = useState(null);
    const [analyses, setAnalyses] = useState({});

    // Filter Modal State
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [tickerSearch, setTickerSearch] = useState("");

    const fetchNews = async () => {
        setLoading(true);
        setError(null);
        try {
            let response;
            if (!selectedStock || selectedStock === 'ALL') {
                response = await api.get('/global-news');
            } else {
                response = await api.get(`/news/${selectedStock}`);
            }

            if (response.data.ok) {
                setNews(response.data.data);
            } else {
                setError("Haberler yüklenemedi.");
            }
        } catch (err) {
            setError("Sunucu hatası: Haberler alınamadı.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();
    }, [selectedStock]);

    const analyzeNews = async (newsItem) => {
        setAnalyzingId(newsItem.id);
        try {
            const res = await api.post('/news/analyze', {
                title: newsItem.title,
                description: newsItem.description || newsItem.summary,
                symbol: selectedStock === 'ALL' ? '' : selectedStock
            });

            if (res.data.ok) {
                setAnalyses(prev => ({
                    ...prev,
                    [newsItem.id]: res.data.data
                }));
            }
        } catch (err) {
            console.error('Analysis error:', err);

            // 429: Günlük limit aşıldı
            if (err.response?.status === 429) {
                const quotaData = err.response?.data?.data;
                setAnalyses(prev => ({
                    ...prev,
                    [newsItem.id]: {
                        sentiment: 'QUOTA_EXCEEDED',
                        analysis: `⚠️ Günlük haber analizi hakkınız doldu! Bugün için ${quotaData?.limit || 1} analiz hakkınızı kullandınız. Yarın (UTC 00:00) haklarınız yenilenecek veya planınızı yükselterek daha fazla analiz hakkı kazanabilirsiniz.`,
                        isQuotaError: true
                    }
                }));
            } else {
                setAnalyses(prev => ({
                    ...prev,
                    [newsItem.id]: {
                        sentiment: 'ERROR',
                        analysis: 'Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.'
                    }
                }));
            }
        } finally {
            setAnalyzingId(null);
        }
    };

    const getSentimentColor = (sentiment) => {
        switch (sentiment) {
            case 'POSITIVE':
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'NEGATIVE':
                return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            case 'NEUTRAL':
                return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
            case 'QUOTA_EXCEEDED':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            default:
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        }
    };

    const getSentimentIcon = (sentiment) => {
        switch (sentiment) {
            case 'POSITIVE':
                return <TrendingUp size={16} />;
            case 'NEGATIVE':
                return <TrendingDown size={16} />;
            case 'NEUTRAL':
                return <Minus size={16} />;
            case 'QUOTA_EXCEEDED':
                return <AlertTriangle size={16} />;
            default:
                return <Sparkles size={16} />;
        }
    };

    const getSentimentLabel = (sentiment) => {
        switch (sentiment) {
            case 'POSITIVE':
                return 'Yükseliş Beklentisi';
            case 'NEGATIVE':
                return 'Düşüş Riski';
            case 'NEUTRAL':
                return 'Nötr Etki';
            case 'QUOTA_EXCEEDED':
                return 'Limit Aşıldı';
            default:
                return 'Hata';
        }
    };

    const timeAgo = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffHrs = Math.floor(diffMs / 3600000);

        if (diffHrs < 1) return "Az önce";
        if (diffHrs < 24) return `${diffHrs} saat önce`;
        return `${Math.floor(diffHrs / 24)} gün önce`;
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white p-4 md:p-6 lg:p-10">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-8 md:mb-10">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="p-2.5 md:p-3 bg-indigo-600 rounded-xl md:rounded-2xl shadow-lg shadow-indigo-500/20">
                            <Globe className="w-6 h-6 md:w-8 md:h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Haberler & AI Analizi</h1>
                            <p className="text-slate-400 text-xs md:text-sm mt-1 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                FinBot AI ile Piyasa Haberleri
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <QuotaDisplay compact={true} />
                        <button
                            onClick={fetchNews}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700 font-bold w-full md:w-auto justify-center"
                        >
                            <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${loading ? 'animate-spin' : ''}`} />
                            Yenile
                        </button>
                    </div>

                    {/* Stock Filter Button */}
                    <div className="mb-6 md:mb-8">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="flex items-center gap-3 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700 font-bold w-full md:w-auto"
                        >
                            <Filter size={18} className="text-indigo-400" />
                            <span>
                                {selectedStock ? `${selectedStock} Haberleri` : 'Tüm Haberler'}
                            </span>
                            {selectedStock && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedStock(null);
                                    }}
                                    className="ml-2 p-1 hover:bg-rose-500/20 rounded-lg transition-colors"
                                >
                                    <X size={16} className="text-rose-400" />
                                </button>
                            )}
                        </button>
                    </div>

                    {/* Filter Modal */}
                    {isFilterOpen && (
                        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20">
                            <div
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                onClick={() => setIsFilterOpen(false)}
                            />
                            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in duration-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                                        <Filter size={20} className="text-indigo-400" />
                                        Hisse Ara
                                    </h3>
                                    <button
                                        onClick={() => setIsFilterOpen(false)}
                                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        <X size={20} className="text-slate-400" />
                                    </button>
                                </div>

                                <div className="relative mb-4">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Ticker yazın (örn: AAPL, TSLA)"
                                        value={tickerSearch}
                                        onChange={(e) => setTickerSearch(e.target.value.toUpperCase())}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                                        autoFocus
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setSelectedStock(null);
                                            setTickerSearch("");
                                            setIsFilterOpen(false);
                                        }}
                                        className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-bold"
                                    >
                                        Tüm Haberler
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (tickerSearch.trim()) {
                                                setSelectedStock(tickerSearch.trim());
                                                setIsFilterOpen(false);
                                            }
                                        }}
                                        disabled={!tickerSearch.trim()}
                                        className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all font-bold flex items-center justify-center gap-2"
                                    >
                                        <Search size={18} />
                                        Ara
                                    </button>
                                </div>

                                <p className="mt-4 text-xs text-slate-500 text-center">
                                    Herhangi bir hisse senedi ticker'ı girebilirsiniz
                                </p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/50 text-rose-500 p-5 rounded-2xl mb-8 flex items-center gap-3">
                            <Minus className="w-5 h-5" />
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl md:rounded-3xl p-4 md:p-6 h-[350px] md:h-[400px] animate-pulse">
                                    <div className="w-full h-32 md:h-40 bg-slate-800 rounded-xl md:rounded-2xl mb-4"></div>
                                    <div className="w-3/4 h-5 md:h-6 bg-slate-800 rounded-full mb-2"></div>
                                    <div className="w-full h-3 md:h-4 bg-slate-800 rounded-full mb-2"></div>
                                    <div className="w-full h-3 md:h-4 bg-slate-800 rounded-full"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4 md:space-y-6">
                            {news.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl transition-all"
                                >
                                    <div className="flex items-start justify-between gap-3 md:gap-4 mb-3 md:mb-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3 flex-wrap">
                                                <span className="px-2.5 md:px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] md:text-xs font-bold rounded-lg border border-indigo-500/20">
                                                    {item.source}
                                                </span>
                                                <span className="text-[10px] md:text-xs text-slate-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                                    {timeAgo(item.publishedDate || item.date)}
                                                </span>
                                            </div>
                                            <h3 className="text-base md:text-lg font-bold text-white mb-2 leading-tight">
                                                {item.title}
                                            </h3>
                                            {(item.description || item.summary) && (
                                                <p className="text-xs md:text-sm text-slate-400 leading-relaxed mb-3 md:mb-4 line-clamp-3">
                                                    {item.description || item.summary}
                                                </p>
                                            )}
                                        </div>
                                        {item.url && (
                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 hover:bg-indigo-500/10 rounded-xl transition-colors text-slate-500 hover:text-indigo-400 flex-shrink-0"
                                            >
                                                <ExternalLink size={18} />
                                            </a>
                                        )}
                                    </div>

                                    {/* AI Analysis Button */}
                                    <button
                                        onClick={() => analyzeNews(item)}
                                        disabled={analyzingId === item.id}
                                        className="flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-xs md:text-sm transition-all shadow-lg shadow-indigo-600/20 w-full md:w-auto justify-center"
                                    >
                                        {analyzingId === item.id ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" />
                                                FinBot Analiz Ediyor...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={14} />
                                                FinBot ile Analiz Et
                                                <ChevronRight size={12} />
                                            </>
                                        )}
                                    </button>

                                    {/* AI Analysis Result */}
                                    {analyses[item.id] && (
                                        <div className="mt-3 md:mt-4 p-4 md:p-5 bg-[#0f172a] rounded-xl md:rounded-2xl border border-slate-700/50 animate-in fade-in duration-500">
                                            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3 flex-wrap">
                                                <div
                                                    className={`flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl font-bold text-[10px] md:text-xs uppercase border ${getSentimentColor(
                                                        analyses[item.id].sentiment
                                                    )}`}
                                                >
                                                    {getSentimentIcon(analyses[item.id].sentiment)}
                                                    {getSentimentLabel(analyses[item.id].sentiment)}
                                                </div>
                                                <div className="flex items-center gap-1 text-[9px] md:text-[10px] text-slate-600 font-bold">
                                                    <Sparkles size={10} />
                                                    FinBot AI
                                                </div>
                                            </div>
                                            <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-medium">
                                                {analyses[item.id].analysis}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NewsPage;
