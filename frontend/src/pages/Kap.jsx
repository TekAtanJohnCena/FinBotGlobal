import React, { useState, useEffect } from 'react';
import api from "../lib/api";
import {
  Newspaper,
  RefreshCw,
  ExternalLink,
  Clock,
  Globe,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

const MarketNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/global-news');
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
  }, []);

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
              <h1 className="text-3xl font-bold tracking-tight">Global Piyasa Haberleri</h1>
              <p className="text-slate-400 mt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                NASDAQ & NYSE Canlı Haber Akışı
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item) => (
              <div
                key={item.id}
                className="group bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-3xl overflow-hidden shadow-xl transition-all flex flex-col hover:-translate-y-1"
              >
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded-lg border border-indigo-500/20">
                      {item.source}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {timeAgo(item.date)}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors mb-3 line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-slate-400 text-sm line-clamp-4 mb-6 leading-relaxed">
                    {item.summary || "Bu haber için açıklama bulunmuyor."}
                  </p>

                  <div className="mt-auto">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:text-white transition-colors group/link"
                    >
                      Haberi Oku
                      <ExternalLink className="w-4 h-4 group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketNews;