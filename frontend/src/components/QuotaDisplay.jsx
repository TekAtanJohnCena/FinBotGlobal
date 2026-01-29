// QuotaDisplay Component - Shows user's remaining quota
import React, { useState, useEffect } from 'react';
import { MessageSquare, Newspaper, TrendingUp, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const QuotaDisplay = ({ compact = false }) => {
    const [quota, setQuota] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuota = async () => {
            try {
                const response = await api.get('/user/quota');
                if (response.data.ok) {
                    setQuota(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch quota:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuota();
    }, []);

    if (loading || !quota) return null;

    const planNames = {
        FREE: 'Ücretsiz',
        PLUS: 'Plus',
        PRO: 'Pro'
    };

    const getProgressColor = (used, limit) => {
        const ratio = used / limit;
        if (ratio >= 1) return 'bg-rose-500';
        if (ratio >= 0.8) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    if (compact) {
        return (
            <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-1.5">
                    <MessageSquare size={12} className="text-indigo-400" />
                    <span className="text-xs font-bold text-slate-300">
                        {quota.finbotQueries.remaining}/{quota.finbotQueries.limit}
                    </span>
                </div>
                <div className="w-px h-4 bg-slate-700" />
                <div className="flex items-center gap-1.5">
                    <Newspaper size={12} className="text-purple-400" />
                    <span className="text-xs font-bold text-slate-300">
                        {quota.newsAnalysis.remaining}/{quota.newsAnalysis.limit}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#1e222d] border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-200 flex items-center gap-2">
                    <TrendingUp size={16} className="text-indigo-400" />
                    Günlük Kullanım
                </h3>
                <span className={`px-2 py-1 text-[10px] font-black uppercase rounded ${quota.plan === 'PRO' ? 'bg-purple-500/20 text-purple-400' :
                    quota.plan === 'PLUS' ? 'bg-indigo-500/20 text-indigo-400' :
                        'bg-slate-700 text-slate-400'
                    }`}>
                    {planNames[quota.plan]}
                </span>
            </div>

            {/* Finbot Queries */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold flex items-center gap-1.5">
                        <MessageSquare size={12} className="text-indigo-400" />
                        Finbot Sorguları
                    </span>
                    <span className="font-mono font-bold text-slate-300">
                        {quota.finbotQueries.used}/{quota.finbotQueries.limit}
                    </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${getProgressColor(quota.finbotQueries.used, quota.finbotQueries.limit)} transition-all rounded-full`}
                        style={{ width: `${Math.min(100, (quota.finbotQueries.used / quota.finbotQueries.limit) * 100)}%` }}
                    />
                </div>
            </div>

            {/* News Analysis */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold flex items-center gap-1.5">
                        <Newspaper size={12} className="text-purple-400" />
                        Haber Analizi
                    </span>
                    <span className="font-mono font-bold text-slate-300">
                        {quota.newsAnalysis.used}/{quota.newsAnalysis.limit}
                    </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${getProgressColor(quota.newsAnalysis.used, quota.newsAnalysis.limit)} transition-all rounded-full`}
                        style={{ width: `${Math.min(100, (quota.newsAnalysis.used / quota.newsAnalysis.limit) * 100)}%` }}
                    />
                </div>
            </div>

            {/* Reset Info */}
            <div className="text-[10px] text-slate-500 font-medium text-center pt-2 border-t border-slate-800">
                UTC gece yarısı sıfırlanır
            </div>

            {/* Upgrade CTA */}
            {quota.plan !== 'PRO' && (
                <Link
                    to="/pricing"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-bold text-xs transition-all"
                >
                    <Sparkles size={14} />
                    {quota.plan === 'FREE' ? 'Plus\'a Yükselt' : 'Pro\'ya Yükselt'}
                </Link>
            )}
        </div>
    );
};

export default QuotaDisplay;
