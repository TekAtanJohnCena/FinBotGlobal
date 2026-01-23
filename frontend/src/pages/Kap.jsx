import React, { useState, useEffect } from 'react';
import api from "../lib/api";
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
  Calendar
} from 'lucide-react';

const NewsPage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [analyses, setAnalyses] = useState({});

  const popularStocks = [
    { symbol: 'ALL', name: 'Tüm Haberler' },
    { symbol: 'AAPL', name: 'Apple' },
    { symbol: 'TSLA', name: 'Tesla' },
    { symbol: 'NVDA', name: 'NVIDIA' },
    { symbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'GOOGL', name: 'Google' },
    { symbol: 'META', name: 'Meta' },
    { symbol: 'AMZN', name: 'Amazon' }
  ];

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
    // Token kontrolü
    const token = localStorage.getItem('token');
    if (!token) {
      setAnalyses(prev => ({
        ...prev,
        [newsItem.id]: {
          sentiment: 'ERROR',
          analysis: '⚠️ Lütfen giriş yapın. Haber analizi için oturum açmanız gerekmektedir.'
        }
      }));
      return;
    }

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

      // 401 hatası için özel mesaj
      if (err.response?.status === 401) {
        setAnalyses(prev => ({
          ...prev,
          [newsItem.id]: {
            sentiment: 'ERROR',
            analysis: '🔒 Oturumunuz sona ermiş. Lütfen yeniden giriş yapın.'
          }
        }));
        // Token'ı temizle
        localStorage.removeItem('token');
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
    <div className="min-h-screen bg-[#020617] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
              <Globe className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Haberler & AI Analizi</h1>
              <p className="text-slate-400 mt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                FinBot AI ile Piyasa Haberleri
              </p>
            </div>
          </div>

          <button
            onClick={fetchNews}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700 font-bold"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
        </div>

        {/* Stock Filter Chips */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Filter size={16} className="text-slate-500" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">
              Hisse Filtresi
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {popularStocks.map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => setSelectedStock(stock.symbol === 'ALL' ? null : stock.symbol)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all ${(selectedStock === stock.symbol || (!selectedStock && stock.symbol === 'ALL'))
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 border border-indigo-500'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600'
                  }`}
              >
                {stock.symbol !== 'ALL' && <Building2 size={16} />}
                {stock.symbol}
                <span className="text-xs opacity-70">({stock.name})</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/50 text-rose-500 p-5 rounded-2xl mb-8 flex items-center gap-3">
            <Minus className="w-5 h-5" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 h-[400px] animate-pulse">
                <div className="w-full h-40 bg-slate-800 rounded-2xl mb-4"></div>
                <div className="w-3/4 h-6 bg-slate-800 rounded-full mb-2"></div>
                <div className="w-full h-4 bg-slate-800 rounded-full mb-2"></div>
                <div className="w-full h-4 bg-slate-800 rounded-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {news.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-6 shadow-xl transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded-lg border border-indigo-500/20">
                        {item.source}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {timeAgo(item.publishedDate || item.date)}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 leading-tight">
                      {item.title}
                    </h3>
                    {(item.description || item.summary) && (
                      <p className="text-sm text-slate-400 leading-relaxed mb-4 line-clamp-3">
                        {item.description || item.summary}
                      </p>
                    )}
                  </div>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-indigo-500/10 rounded-xl transition-colors text-slate-500 hover:text-indigo-400"
                    >
                      <ExternalLink size={20} />
                    </a>
                  )}
                </div>

                {/* AI Analysis Button */}
                <button
                  onClick={() => analyzeNews(item)}
                  disabled={analyzingId === item.id}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20"
                >
                  {analyzingId === item.id ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      FinBot Analiz Ediyor...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      FinBot ile Analiz Et
                      <ChevronRight size={14} />
                    </>
                  )}
                </button>

                {/* AI Analysis Result */}
                {analyses[item.id] && (
                  <div className="mt-4 p-5 bg-[#0f172a] rounded-2xl border border-slate-700/50 animate-in fade-in duration-500">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase border ${getSentimentColor(
                          analyses[item.id].sentiment
                        )}`}
                      >
                        {getSentimentIcon(analyses[item.id].sentiment)}
                        {getSentimentLabel(analyses[item.id].sentiment)}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-600 font-bold">
                        <Sparkles size={12} />
                        FinBot AI
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
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
  );
};

export default NewsPage;