// UpgradeModal Component - Shows when quota is exceeded
import React from 'react';
import { X, Sparkles, MessageSquare, Newspaper, BarChart2, ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const UpgradeModal = ({ isOpen, onClose, quotaType = 'finbot', currentPlan = 'FREE' }) => {
    if (!isOpen) return null;

    const planNames = {
        FREE: 'Ücretsiz',
        BASIC: 'Plus',
        PREMIUM: 'Pro'
    };

    const quotaInfo = {
        finbot: {
            title: 'Finbot Sorgu Limitiniz Doldu',
            icon: MessageSquare,
            iconColor: 'text-indigo-400',
            description: 'Günlük Finbot sorgu limitinize ulaştınız. Daha fazla analiz yapmak için planınızı yükseltin.',
            limits: {
                FREE: 5,
                BASIC: 50,
                PREMIUM: 250
            }
        },
        news: {
            title: 'Haber Analizi Limitiniz Doldu',
            icon: Newspaper,
            iconColor: 'text-purple-400',
            description: 'Günlük haber analizi limitinize ulaştınız. Daha fazla haber analizi için planınızı yükseltin.',
            limits: {
                FREE: 1,
                BASIC: 10,
                PREMIUM: 50
            }
        }
    };

    const info = quotaInfo[quotaType];
    const Icon = info.icon;

    const planFeatures = {
        BASIC: {
            name: 'Plus',
            price: '149₺',
            period: '/ay',
            features: [
                'Günlük 50 Finbot sorgusu',
                'Günlük 10 haber analizi',
                '10 yıllık mali veri',
                'Öncelikli destek'
            ]
        },
        PREMIUM: {
            name: 'Pro',
            price: '299₺',
            period: '/ay',
            features: [
                'Günlük 250 Finbot sorgusu',
                'Günlük 50 haber analizi',
                '25+ yıllık mali veri',
                '7/24 VIP destek',
                'API erişimi'
            ]
        }
    };

    const recommendedPlan = currentPlan === 'FREE' ? 'BASIC' : 'PREMIUM';
    const plan = planFeatures[recommendedPlan];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-[#1e222d] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="relative p-6 pb-4 border-b border-slate-800">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex items-center gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center ${info.iconColor}`}>
                            <Icon size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white">{info.title}</h2>
                            <p className="text-xs text-slate-500 font-medium">Şu anki plan: {planNames[currentPlan]}</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-400">{info.description}</p>
                </div>

                {/* Plan Comparison */}
                <div className="p-6 space-y-4">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                        Limit Karşılaştırması
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {['FREE', 'BASIC', 'PREMIUM'].map((tier) => (
                            <div
                                key={tier}
                                className={`p-3 rounded-xl text-center ${tier === currentPlan
                                        ? 'bg-slate-800 border border-slate-700'
                                        : tier === recommendedPlan
                                            ? 'bg-gradient-to-b from-indigo-500/20 to-purple-500/20 border border-indigo-500/30'
                                            : 'bg-slate-800/50'
                                    }`}
                            >
                                <div className="text-[10px] font-black text-slate-500 uppercase mb-1">
                                    {planNames[tier]}
                                </div>
                                <div className={`text-xl font-black ${tier === currentPlan ? 'text-slate-400' : 'text-white'}`}>
                                    {info.limits[tier]}
                                </div>
                                <div className="text-[9px] text-slate-600">sorgu/gün</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recommended Plan */}
                <div className="p-6 pt-0">
                    <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Sparkles size={16} className="text-indigo-400" />
                                <span className="font-black text-white">{plan.name}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-xl font-black text-white">{plan.price}</span>
                                <span className="text-sm text-slate-500">{plan.period}</span>
                            </div>
                        </div>
                        <ul className="space-y-2 mb-4">
                            {plan.features.map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                                    <Check size={14} className="text-emerald-400 shrink-0" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <Link
                            to="/pricing"
                            onClick={onClose}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/20"
                        >
                            <Sparkles size={16} />
                            {plan.name}'a Yükselt
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-4 text-center">
                    <button
                        onClick={onClose}
                        className="text-xs text-slate-500 hover:text-slate-400 font-medium"
                    >
                        Yarın tekrar dene
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;
