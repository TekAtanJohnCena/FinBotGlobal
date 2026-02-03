// PATH: src/pages/Onboarding.jsx
// Premium Onboarding Experience - Dark Theme, Mobile-First Design
// One-time profile completion survey with progress indicator

import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
    ChartBarIcon,
    ShieldCheckIcon,
    RocketLaunchIcon,
    CurrencyDollarIcon,
    CheckCircleIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
    SparklesIcon,
} from "@heroicons/react/24/outline";

// ==================== CONSTANTS ====================
const STEPS = [
    { id: 0, title: "Hoş Geldiniz", icon: SparklesIcon },
    { id: 1, title: "Deneyim", icon: ChartBarIcon },
    { id: 2, title: "Risk Toleransı", icon: ShieldCheckIcon },
    { id: 3, title: "Hedefler", icon: RocketLaunchIcon },
    { id: 4, title: "Bütçe", icon: CurrencyDollarIcon },
];

const EXPERIENCE_OPTIONS = [
    { value: "beginner", label: "Yeni Başlayan", description: "Yatırım dünyasına yeni adım atıyorum" },
    { value: "intermediate", label: "Orta Seviye", description: "Temel yatırım bilgisine sahibim" },
    { value: "advanced", label: "Uzman", description: "Aktif olarak yatırım yapıyorum" },
];

const RISK_OPTIONS = [
    { value: "conservative", label: "Muhafazakar", description: "Düşük risk, stabil getiri" },
    { value: "moderate", label: "Dengeli", description: "Orta risk, dengeli büyüme" },
    { value: "aggressive", label: "Agresif", description: "Yüksek risk, yüksek potansiyel" },
];

const GOAL_OPTIONS = [
    { value: "short-term", label: "Kısa Vadeli", description: "1 yıldan az" },
    { value: "long-term", label: "Uzun Vadeli", description: "5+ yıl yatırım" },
    { value: "retirement", label: "Emeklilik", description: "Emeklilik için birikim" },
    { value: "income", label: "Pasif Gelir", description: "Düzenli gelir elde etme" },
];

const SECTOR_OPTIONS = [
    { value: "tech", label: "Teknoloji", icon: "💻" },
    { value: "healthcare", label: "Sağlık", icon: "🏥" },
    { value: "finance", label: "Finans", icon: "🏦" },
    { value: "energy", label: "Enerji", icon: "⚡" },
    { value: "consumer", label: "Tüketici", icon: "🛍️" },
    { value: "industrial", label: "Sanayi", icon: "🏭" },
    { value: "realestate", label: "Gayrimenkul", icon: "🏠" },
    { value: "crypto", label: "Kripto", icon: "₿" },
];

const BUDGET_OPTIONS = [
    { value: "0-1000", label: "$0 - $1,000", description: "Başlangıç seviyesi" },
    { value: "1000-5000", label: "$1,000 - $5,000", description: "Orta bütçe" },
    { value: "5000-10000", label: "$5,000 - $10,000", description: "Aktif yatırımcı" },
    { value: "10000+", label: "$10,000+", description: "Premium yatırımcı" },
];

// ==================== COMPONENTS ====================

// Progress Bar Component
const ProgressBar = ({ currentStep, totalSteps }) => (
    <div className="w-full mb-8">
        {/* Step Indicators */}
        <div className="flex justify-between items-center mb-3">
            {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;

                return (
                    <div key={step.id} className="flex flex-col items-center relative">
                        <div
                            className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isCompleted
                                ? "bg-emerald-500 text-white"
                                : isCurrent
                                    ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white ring-4 ring-cyan-500/30"
                                    : "bg-zinc-800 text-zinc-500"
                                }`}
                        >
                            {isCompleted ? (
                                <CheckCircleIcon className="w-5 h-5 md:w-6 md:h-6" />
                            ) : (
                                <Icon className="w-5 h-5 md:w-6 md:h-6" />
                            )}
                        </div>
                        <span className={`text-xs mt-2 hidden md:block ${isCurrent ? "text-cyan-400" : "text-zinc-500"}`}>
                            {step.title}
                        </span>
                    </div>
                );
            })}
        </div>

        {/* Progress Line */}
        <div className="relative h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
                className="absolute h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
            />
        </div>
    </div>
);

// Selection Card Component
const SelectionCard = ({ option, selected, onClick, showDescription = true }) => (
    <button
        onClick={onClick}
        className={`w-full p-4 md:p-5 rounded-xl border-2 text-left transition-all duration-200 ${selected
            ? "border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/30"
            : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800/50"
            }`}
    >
        <div className="flex items-center gap-3">
            {option.icon && <span className="text-2xl">{option.icon}</span>}
            <div className="flex-1">
                <p className={`font-semibold text-base md:text-lg ${selected ? "text-cyan-400" : "text-white"}`}>
                    {option.label}
                </p>
                {showDescription && option.description && (
                    <p className="text-sm text-zinc-400 mt-0.5">{option.description}</p>
                )}
            </div>
            {selected && <CheckCircleIcon className="w-6 h-6 text-cyan-400 flex-shrink-0" />}
        </div>
    </button>
);

// Sector Chip Component
const SectorChip = ({ option, selected, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-3 rounded-xl border-2 flex items-center gap-2 transition-all duration-200 ${selected
            ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
            : "border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:border-zinc-600"
            }`}
    >
        <span className="text-xl">{option.icon}</span>
        <span className="font-medium">{option.label}</span>
    </button>
);

// ==================== MAIN COMPONENT ====================
const Onboarding = () => {
    const navigate = useNavigate();
    const { user, completeProfile } = useContext(AuthContext);

    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Survey Data State
    const [surveyData, setSurveyData] = useState({
        investmentExperience: "",
        riskTolerance: "",
        investmentGoals: "",
        preferredSectors: [],
        monthlyBudget: "",
    });

    // Handlers
    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
            setError("");
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            setError("");
        }
    };

    const handleSectorToggle = (sector) => {
        setSurveyData((prev) => ({
            ...prev,
            preferredSectors: prev.preferredSectors.includes(sector)
                ? prev.preferredSectors.filter((s) => s !== sector)
                : [...prev.preferredSectors, sector],
        }));
    };

    const handleSubmit = async () => {
        // Validation
        if (!surveyData.investmentExperience || !surveyData.riskTolerance ||
            !surveyData.investmentGoals || !surveyData.monthlyBudget) {
            setError("Lütfen tüm zorunlu alanları doldurun.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await completeProfile(surveyData);
            navigate("/chat", { replace: true });
        } catch (err) {
            console.error("Profile completion error:", err);
            setError(err.response?.data?.message || "Profil tamamlanamadı. Lütfen tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 0: return true; // Welcome screen
            case 1: return !!surveyData.investmentExperience;
            case 2: return !!surveyData.riskTolerance;
            case 3: return !!surveyData.investmentGoals;
            case 4: return !!surveyData.monthlyBudget;
            default: return false;
        }
    };

    // ==================== RENDER STEPS ====================
    const renderStepContent = () => {
        switch (currentStep) {
            // Welcome Step
            case 0:
                return (
                    <div className="text-center py-8 md:py-12">
                        <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                            <SparklesIcon className="w-10 h-10 md:w-12 md:h-12 text-white" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                            Hoş Geldiniz, {user?.firstName || "Yatırımcı"}! 👋
                        </h2>
                        <p className="text-zinc-400 text-base md:text-lg max-w-md mx-auto mb-8">
                            Size en iyi yatırım önerilerini sunabilmemiz için birkaç soru sormamız gerekiyor.
                            Bu, sadece <span className="text-cyan-400 font-semibold">1 dakika</span> sürecek.
                        </p>
                        <div className="flex flex-col gap-3 max-w-sm mx-auto text-left bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                            <div className="flex items-center gap-3">
                                <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                <span className="text-zinc-300">Kişiselleştirilmiş AI analizleri</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                <span className="text-zinc-300">Risk profilinize uygun öneriler</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                <span className="text-zinc-300">Hedeflerinize özel stratejiler</span>
                            </div>
                        </div>
                    </div>
                );

            // Experience Step
            case 1:
                return (
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Yatırım Deneyiminiz</h2>
                        <p className="text-zinc-400 mb-6">Yatırım konusundaki deneyim seviyenizi seçin</p>
                        <div className="space-y-3">
                            {EXPERIENCE_OPTIONS.map((option) => (
                                <SelectionCard
                                    key={option.value}
                                    option={option}
                                    selected={surveyData.investmentExperience === option.value}
                                    onClick={() => setSurveyData({ ...surveyData, investmentExperience: option.value })}
                                />
                            ))}
                        </div>
                    </div>
                );

            // Risk Tolerance Step
            case 2:
                return (
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Risk Toleransınız</h2>
                        <p className="text-zinc-400 mb-6">Yatırımlarınızda ne kadar risk almak istersiniz?</p>
                        <div className="space-y-3">
                            {RISK_OPTIONS.map((option) => (
                                <SelectionCard
                                    key={option.value}
                                    option={option}
                                    selected={surveyData.riskTolerance === option.value}
                                    onClick={() => setSurveyData({ ...surveyData, riskTolerance: option.value })}
                                />
                            ))}
                        </div>
                    </div>
                );

            // Goals & Sectors Step
            case 3:
                return (
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Yatırım Hedefleriniz</h2>
                        <p className="text-zinc-400 mb-6">Ana yatırım hedefinizi seçin</p>
                        <div className="space-y-3 mb-8">
                            {GOAL_OPTIONS.map((option) => (
                                <SelectionCard
                                    key={option.value}
                                    option={option}
                                    selected={surveyData.investmentGoals === option.value}
                                    onClick={() => setSurveyData({ ...surveyData, investmentGoals: option.value })}
                                />
                            ))}
                        </div>

                        <h3 className="text-lg font-semibold text-white mb-3">İlgilendiğiniz Sektörler</h3>
                        <p className="text-zinc-400 text-sm mb-4">(Opsiyonel - Birden fazla seçebilirsiniz)</p>
                        <div className="flex flex-wrap gap-2">
                            {SECTOR_OPTIONS.map((option) => (
                                <SectorChip
                                    key={option.value}
                                    option={option}
                                    selected={surveyData.preferredSectors.includes(option.value)}
                                    onClick={() => handleSectorToggle(option.value)}
                                />
                            ))}
                        </div>
                    </div>
                );

            // Budget Step
            case 4:
                return (
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Aylık Yatırım Bütçeniz</h2>
                        <p className="text-zinc-400 mb-6">Aylık olarak ne kadar yatırım yapmayı planlıyorsunuz?</p>
                        <div className="space-y-3 mb-8">
                            {BUDGET_OPTIONS.map((option) => (
                                <SelectionCard
                                    key={option.value}
                                    option={option}
                                    selected={surveyData.monthlyBudget === option.value}
                                    onClick={() => setSurveyData({ ...surveyData, monthlyBudget: option.value })}
                                />
                            ))}
                        </div>

                        {/* Summary Preview */}
                        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-4 mt-6">
                            <h3 className="text-cyan-400 font-semibold mb-3 flex items-center gap-2">
                                <CheckCircleIcon className="w-5 h-5" />
                                Profiliniz Hazır
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-zinc-500">Deneyim:</span>
                                    <p className="text-white">{EXPERIENCE_OPTIONS.find(o => o.value === surveyData.investmentExperience)?.label || "-"}</p>
                                </div>
                                <div>
                                    <span className="text-zinc-500">Risk:</span>
                                    <p className="text-white">{RISK_OPTIONS.find(o => o.value === surveyData.riskTolerance)?.label || "-"}</p>
                                </div>
                                <div>
                                    <span className="text-zinc-500">Hedef:</span>
                                    <p className="text-white">{GOAL_OPTIONS.find(o => o.value === surveyData.investmentGoals)?.label || "-"}</p>
                                </div>
                                <div>
                                    <span className="text-zinc-500">Bütçe:</span>
                                    <p className="text-white">{BUDGET_OPTIONS.find(o => o.value === surveyData.monthlyBudget)?.label || "-"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    // ==================== MAIN RENDER ====================
    return (
        <div className="min-h-screen bg-[#0b0c0f] flex flex-col">
            {/* Header */}
            <header className="p-4 md:p-6 border-b border-zinc-800">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo192.png"
                            alt="Finbot"
                            className="w-10 h-10 md:w-12 md:h-12 object-contain"
                        />
                        <span className="text-white font-semibold text-lg hidden md:block">Finbot</span>
                    </div>
                    <span className="text-zinc-500 text-sm">
                        Adım {currentStep + 1} / {STEPS.length}
                    </span>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                    <ProgressBar currentStep={currentStep} totalSteps={STEPS.length} />

                    <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800 p-4 md:p-8 min-h-[400px]">
                        {renderStepContent()}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                </div>
            </main>

            {/* Footer Navigation */}
            <footer className="p-4 md:p-6 border-t border-zinc-800 bg-zinc-900/50">
                <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${currentStep === 0
                            ? "opacity-0 pointer-events-none"
                            : "bg-zinc-800 text-white hover:bg-zinc-700"
                            }`}
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                        <span className="hidden md:inline">Geri</span>
                    </button>

                    {currentStep < STEPS.length - 1 ? (
                        <button
                            onClick={handleNext}
                            disabled={!canProceed()}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${canProceed()
                                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600"
                                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                }`}
                        >
                            <span>Devam Et</span>
                            <ArrowRightIcon className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!canProceed() || loading}
                            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all ${canProceed() && !loading
                                ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600"
                                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                }`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Kaydediliyor...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircleIcon className="w-5 h-5" />
                                    <span>Tamamla</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </footer>
        </div>
    );
};

export default Onboarding;
