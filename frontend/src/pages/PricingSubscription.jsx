import React, { useState, useContext, useMemo } from 'react';
import { LanguageContext } from "../context/LanguageContext";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Check, Shield, Zap, TrendingUp, Building2, HelpCircle, Mail, LifeBuoy } from 'lucide-react';
import PaymentModal from "../components/PaymentModal";
import { savePendingPlan } from "../hooks/usePaymentFlow";

const PricingSubscription = () => {
  const { t } = useContext(LanguageContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [period, setPeriod] = useState("monthly");
  const nf = useMemo(() => new Intl.NumberFormat("tr-TR"), []);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      key: "free",
      icon: <TrendingUp className="w-6 h-6" />,
      highlight: false,
      monthly: 0,
    },
    {
      key: "plus",
      icon: <Zap className="w-6 h-6" />,
      highlight: true,
      monthly: 369,
    },
    {
      key: "pro",
      icon: <Shield className="w-6 h-6" />,
      highlight: false,
      monthly: 449,
    },
    {
      key: "enterprise",
      icon: <Building2 className="w-6 h-6" />,
      highlight: false,
      monthly: null,
    }
  ];

  const calcPrice = (monthlyPrice) => {
    if (period === "monthly") return monthlyPrice;
    return Math.round(monthlyPrice * 12 * 0.80); // 20% discount for yearly
  };

  const calculateMonthlyEquivalent = (monthlyPrice) => {
    const yearlyPrice = Math.round(monthlyPrice * 12 * 0.80);
    return Math.round(yearlyPrice / 12);
  };

  // Handle plan selection
  const handlePlanSelect = (planKey, monthlyPrice) => {
    // Enterprise goes to contact
    if (planKey === 'enterprise') {
      navigate('/contact');
      return;
    }

    // Free plan
    if (planKey === 'free') {
      if (user) {
        navigate('/chat');
      } else {
        navigate('/register');
      }
      return;
    }

    // Paid plans (plus, pro)
    const price = calcPrice(monthlyPrice);

    if (user) {
      // User is logged in - show payment modal
      setSelectedPlan({
        key: planKey,
        name: planKey === 'plus' ? 'Plus' : 'Pro',
        price: price,
        period: period
      });
      setShowPaymentModal(true);
    } else {
      // Guest user - save plan and redirect to register
      savePendingPlan(planKey, period);
      navigate('/register');
    }
  };

  const handlePaymentSuccess = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white py-20 px-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Navigation */}
        <nav className="flex items-center justify-between mb-16 py-4">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={require("../images/logo1.png")} alt="FinBot Logo" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              FinBot
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/support" className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
              <LifeBuoy size={18} />
              {t('sidebar.support')}
            </Link>
            <Link to="/contact" className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-all border border-slate-700">
              <Mail size={18} />
              {t('pricing.contactUs')}
            </Link>
          </div>
        </nav>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            {t('pricing.title')}
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>

          {/* Toggle Switch */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-bold ${period === "monthly" ? "text-white" : "text-slate-500"}`}>
              {t('pricing.monthly')}
            </span>
            <button
              onClick={() => setPeriod(period === "monthly" ? "yearly" : "monthly")}
              className={`w-14 h-8 flex items-center bg-slate-800 rounded-full p-1 transition-all duration-300 ${period === "yearly" ? "bg-indigo-600" : ""}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${period === "yearly" ? "translate-x-6" : ""}`}></div>
            </button>
            <span className={`text-sm font-bold flex items-center gap-2 ${period === "yearly" ? "text-white" : "text-slate-500"}`}>
              {t('pricing.yearly')}
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold rounded-full border border-emerald-500/20">
                -{t('pricing.yearlyDiscount')}
              </span>
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`relative bg-slate-900/50 backdrop-blur-xl border rounded-3xl p-6 md:p-8 flex flex-col transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 ${plan.highlight
                ? "border-indigo-500/50 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500/50"
                : "border-slate-800 hover:border-slate-700"
                }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
                  {t('pricing.plus.badgePopular')}
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <div className={`p-3 rounded-2xl ${plan.key === 'free' ? 'bg-slate-800 text-slate-400' :
                  plan.key === 'plus' ? 'bg-indigo-500/20 text-indigo-400' :
                    plan.key === 'pro' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-purple-500/20 text-purple-400'
                  }`}>
                  {plan.icon}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${plan.key === 'free' ? 'bg-slate-800 border-slate-700 text-slate-400' :
                  plan.key === 'plus' ? 'bg-indigo-950/30 border-indigo-500/30 text-indigo-400' :
                    plan.key === 'pro' ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400' :
                      'bg-purple-950/30 border-purple-500/30 text-purple-400'
                  }`}>
                  {t(`pricing.${plan.key}.badge`)}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                {t(`pricing.${plan.key}.title`)}
              </h3>
              <p className="text-sm text-slate-400 mb-6 h-10">
                {t(`pricing.${plan.key}.subtitle`)}
              </p>

              <div className="mb-8">
                {plan.monthly === null ? (
                  <div>
                    <span className="text-3xl font-black text-white">{t('pricing.contactUs')}</span>
                    <p className="text-xs text-slate-500 mt-1">{t('pricing.contactSubtitle')}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-black text-white">
                        ₺{nf.format(period === 'monthly' ? plan.monthly : calcPrice(plan.monthly))}
                      </span>
                      <span className="text-slate-500 mb-1 font-medium">
                        /{t(period === 'monthly' ? 'pricing.perMonth' : 'pricing.perYear')}
                      </span>
                    </div>
                    {period === 'yearly' && plan.monthly > 0 && (
                      <div className="mt-2 text-xs text-emerald-400 font-bold">
                        {t('pricing.monthlyEquivalent')}: ₺{nf.format(calculateMonthlyEquivalent(plan.monthly))}/{t('pricing.perMonth')}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-4 flex-grow mb-8">
                {t(`pricing.${plan.key}.features`).map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                    <div className="mt-0.5 min-w-[16px]">
                      <Check size={16} className={
                        plan.key === 'free' ? 'text-slate-500' :
                          plan.key === 'plus' ? 'text-indigo-400' :
                            plan.key === 'pro' ? 'text-emerald-400' :
                              'text-purple-400'
                      } />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handlePlanSelect(plan.key, plan.monthly)}
                className={`w-full py-3.5 rounded-xl font-bold transition-all text-center cursor-pointer ${plan.key === 'free'
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  : plan.key === 'enterprise'
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20'
                    : plan.highlight
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-900/20'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                  }`}
              >
                {t(`pricing.${plan.key}.cta`)}
              </button>
            </div>
          ))}
        </div>

        {/* Footer Tagline */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-full border border-slate-800 text-sm text-slate-400">
            <HelpCircle size={16} />
            <span>{t('pricing.tagline')}</span>
          </div>
        </div>

      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          planKey={selectedPlan.key}
          planName={selectedPlan.name}
          price={selectedPlan.price}
          period={selectedPlan.period}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default PricingSubscription;