// PATH: src/pages/Settings.jsx
// Advanced Settings Page - Stripe/Linear Dashboard Style
// Supports Light/Dark Mode with "Green & White" aesthetic

import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useUserProfile } from "../hooks/useUserProfile";
import api from "../lib/api";
import {
    UserIcon,
    ShieldCheckIcon,
    ChartBarIcon,
    StarIcon,
    AdjustmentsHorizontalIcon,
    BellIcon,
    SwatchIcon,
    CreditCardIcon,
    TrashIcon,
    ArrowLeftIcon,
    XMarkIcon,
    LockClosedIcon,
    PlusIcon,
    ArrowDownTrayIcon,

    ExclamationTriangleIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/outline";

// Tab Configuration (base keys mapped to icons)
const TAB_KEYS = [
    { id: "account", icon: UserIcon },
    { id: "security", icon: ShieldCheckIcon },
    { id: "markets", icon: ChartBarIcon },
    { id: "favorites", icon: StarIcon },
    { id: "analysis", icon: AdjustmentsHorizontalIcon },
    { id: "notifications", icon: BellIcon },
    { id: "appearance", icon: SwatchIcon },
    { id: "plan", icon: CreditCardIcon },
    { id: "danger", icon: TrashIcon },
];

// Toggle Switch Component
const Toggle = ({ enabled, onChange, disabled = false }) => (
    <button
        type="button"
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`
      relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
      transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900
      ${enabled ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    `}
    >
        <span
            className={`
        pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
        transition duration-200 ease-in-out
        ${enabled ? 'translate-x-5' : 'translate-x-0'}
      `}
        />
    </button>
);

// Section Header Component
const SectionHeader = ({ title, description }) => (
    <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h2>
        {description && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
    </div>
);

// Form Row Component
const FormRow = ({ label, description, children, required = false }) => (
    <div className="py-4 border-b border-zinc-200 dark:border-zinc-800/50 last:border-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="lg:w-1/2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {label}
                    {required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
                </label>
                {description && <p className="mt-1 text-xs text-zinc-500">{description}</p>}
            </div>
            <div className="lg:w-1/2 flex justify-end">{children}</div>
        </div>
    </div>
);

// Input Component
const Input = ({ value, onChange, placeholder, disabled = false, type = "text", className = "" }) => (
    <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`
      w-full max-w-xs px-3 py-2 rounded-lg 
      bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 
      text-zinc-900 dark:text-white text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500
      focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500
      disabled:opacity-50 disabled:cursor-not-allowed
      ${className}
    `}
    />
);


// Segmented Control Component
const SegmentedControl = ({ options, value, onChange }) => (
    <div className="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800/50 p-1 border border-zinc-200 dark:border-zinc-700/50">
        {options.map((opt) => (
            <button
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className={`
          px-4 py-1.5 text-sm font-medium rounded-md transition-all
          ${value === opt.value
                        ? 'bg-white dark:bg-emerald-500 text-emerald-600 dark:text-white shadow-sm border border-zinc-200 dark:border-transparent'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}
        `}
            >
                {opt.label}
            </button>
        ))}
    </div>
);

// TagInput Component with Async Validation
const TagInput = ({ tags, onAdd, onRemove }) => {
    const [inputValue, setInputValue] = useState("");
    const [validating, setValidating] = useState(false);
    const [error, setError] = useState("");

    const validateAndAdd = async (tag) => {
        setError("");

        // Basic format validation
        if (!/^[A-Z]{1,5}$/.test(tag)) {
            setError("Invalid format. Use 1-5 letters.");
            return;
        }

        if (tags.includes(tag)) {
            setError("Already added.");
            return;
        }

        setValidating(true);
        try {
            // Check if symbol exists via API
            const res = await api.get(`/price/${tag}`);
            if (res.data?.ok) {
                onAdd(tag);
                setInputValue("");
            } else {
                setError("Symbol not found.");
            }
        } catch (err) {
            setError("Invalid symbol.");
        } finally {
            setValidating(false);
        }
    };

    const handleKeyDown = async (e) => {
        if (e.key === "Enter" && inputValue.trim()) {
            e.preventDefault();
            await validateAndAdd(inputValue.trim().toUpperCase());
        }
    };

    return (
        <div className="w-full max-w-md">
            <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium border border-emerald-200 dark:border-emerald-500/20"
                    >
                        {tag}
                        <button onClick={() => onRemove(tag)} className="hover:text-emerald-500 dark:hover:text-emerald-300">
                            <XMarkIcon className="w-3.5 h-3.5" />
                        </button>
                    </span>
                ))}
            </div>
            <div className="relative">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value.toUpperCase());
                            setError("");
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Add symbol (e.g., AAPL)"
                        disabled={validating}
                        className={`
              flex-1 px-3 py-2 rounded-lg 
              bg-white dark:bg-zinc-800/50 border text-zinc-900 dark:text-white text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500 
              focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50
              ${error ? "border-red-500 focus:border-red-500" : "border-zinc-200 dark:border-zinc-700"}
            `}
                    />
                    <button
                        onClick={() => {
                            if (inputValue.trim()) {
                                validateAndAdd(inputValue.trim().toUpperCase());
                            }
                        }}
                        disabled={validating || !inputValue.trim()}
                        className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[44px]"
                    >
                        {validating ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <PlusIcon className="w-4 h-4" />
                        )}
                    </button>
                </div>
                {error && (
                    <p className="absolute -bottom-6 left-0 text-xs text-red-500 dark:text-red-400">{error}</p>
                )}
            </div>
        </div>
    );
};

// ProgressBar removed — using inline bars in Plan & Usage tab instead

// Password Modal Component
const PasswordModal = ({ isOpen, onClose, onSubmit }) => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (newPassword !== confirmPassword) {
            setError("Yeni şifreler eşleşmiyor.");
            return;
        }

        if (newPassword.length < 6) {
            setError("Şifre en az 6 karakter olmalıdır.");
            return;
        }

        setLoading(true);
        try {
            await onSubmit(currentPassword, newPassword);
            onClose();
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            setError(err.response?.data?.message || "Şifre değiştirilemedi.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md shadow-2xl">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Change Password</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-2">Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-2">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-2">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-white font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-medium transition-colors disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Main Settings Component
export default function Settings() {
    const { logout } = useContext(AuthContext);
    const { profile, loading: profileLoading, refetch } = useUserProfile();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("account");
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // ==================== STATE ====================
    // Account
    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [createdAt, setCreatedAt] = useState("");
    const [usernameError, setUsernameError] = useState("");

    // Security
    const [googleConnected, setGoogleConnected] = useState(false);
    const [sessions] = useState([
        { id: 1, device: "Chrome on Windows", location: "Istanbul, Turkey", current: true },
        { id: 2, device: "Safari on iPhone", location: "Ankara, Turkey", current: false },
    ]);

    // Preferences
    const [responseLength, setResponseLength] = useState("normal");
    const [language, setLanguage] = useState("tr");
    const [explanationLevel, setExplanationLevel] = useState("intermediate");
    const [saveHistory, setSaveHistory] = useState(true);
    const [autoDelete, setAutoDelete] = useState("never");
    const [markets] = useState([
        { id: "nasdaq", name: "NASDAQ", locked: true, enabled: true },
        { id: "nyse", name: "NYSE", locked: true, enabled: true },
    ]);
    const [favoriteStocks, setFavoriteStocks] = useState(["AAPL", "MSFT", "NVDA", "AMZN"]);
    const [quarterlyEarnings, setQuarterlyEarnings] = useState(true);
    const [annualFinancials, setAnnualFinancials] = useState(true);
    const [showCharts, setShowCharts] = useState(true);
    const [autoSummary, setAutoSummary] = useState(true);
    const [earningsAlerts, setEarningsAlerts] = useState(true);
    const [financialUpdates, setFinancialUpdates] = useState(false);
    const [priceChangePercent, setPriceChangePercent] = useState("5");
    const [weeklySummary, setWeeklySummary] = useState(true);

    // Theme (global via ThemeContext)
    const { theme, setTheme } = useTheme();
    const [numberFormat, setNumberFormat] = useState("compact");
    const [chartAnimations, setChartAnimations] = useState(true);

    // Plan
    const [currentPlan, setCurrentPlan] = useState("FREE");
    const [dailyUsage, setDailyUsage] = useState(0);
    const [dailyLimit, setDailyLimit] = useState(5);
    const [newsUsage, setNewsUsage] = useState(0);
    const [newsLimit, setNewsLimit] = useState(1);
    const [subscriptionEnd, setSubscriptionEnd] = useState(null);
    const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    // ==================== LOAD DATA ====================
    useEffect(() => {
        if (profile) {
            setUsername(profile.username || "");
            setFullName(profile.fullName || "");
            setEmail(profile.email || "");
            setCreatedAt(profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }) : "");
            setGoogleConnected(profile.authType === "google");
            setCurrentPlan(profile.subscriptionTier || "FREE");

            const s = profile.settings || {};
            setResponseLength(s.responseLength || "normal");
            setLanguage(s.language || "tr");
            setExplanationLevel(s.explanationLevel || "intermediate");
            setSaveHistory(s.saveHistory !== false);
            setAutoDelete(s.autoDelete || "never");
            setFavoriteStocks(s.favoriteStocks || ["AAPL", "MSFT", "NVDA", "AMZN"]);
            setQuarterlyEarnings(s.quarterlyEarnings !== false);
            setAnnualFinancials(s.annualFinancials !== false);
            setShowCharts(s.showCharts !== false);
            setAutoSummary(s.autoSummary !== false);
            setEarningsAlerts(s.earningsAlerts !== false);
            setFinancialUpdates(s.financialUpdates || false);
            setPriceChangePercent(s.priceChangePercent || "5");
            setWeeklySummary(s.weeklySummary !== false);
            setTheme(s.theme || "dark");
            setNumberFormat(s.numberFormat || "compact");
            setChartAnimations(s.chartAnimations !== false);
        }
    }, [profile, setTheme]);

    useEffect(() => {
        const loadQuotaAndSubscription = async () => {
            try {
                // Fetch quota
                const quotaRes = await api.get("/user/quota");
                if (quotaRes.data?.ok) {
                    const d = quotaRes.data.data;
                    setDailyUsage(d?.finbotQueries?.used || 0);
                    setDailyLimit(d?.finbotQueries?.limit || 5);
                    setNewsUsage(d?.newsAnalysis?.used || 0);
                    setNewsLimit(d?.newsAnalysis?.limit || 1);
                }
                // Fetch subscription status
                const subRes = await api.get("/subscription/status");
                if (subRes.data?.ok) {
                    const sub = subRes.data.data;
                    if (sub?.currentPeriodEnd) setSubscriptionEnd(new Date(sub.currentPeriodEnd));
                    if (sub?.cancelAtPeriodEnd) setCancelAtPeriodEnd(true);
                }
            } catch (err) { }
        };
        loadQuotaAndSubscription();
    }, []);

    // ==================== ACTION HANDLERS ====================
    const handleSave = async () => {
        if (usernameError) return;
        setSaving(true);
        try {
            await api.put("/user/profile", { username, fullName });
            await api.put("/user/settings", {
                settings: {
                    responseLength, language, explanationLevel, saveHistory, autoDelete,
                    favoriteStocks, quarterlyEarnings, annualFinancials, showCharts, autoSummary,
                    earningsAlerts, financialUpdates, priceChangePercent, weeklySummary,
                    theme, numberFormat, chartAnimations,
                }
            });
            setSaveSuccess(true);
            refetch();
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            alert(err.response?.data?.message || t('settings.saveFailed'));
        } finally {
            setSaving(false);
        }
    };

    const validateUsername = (value) => {
        const cleaned = value.toLowerCase().replace(/[^a-z0-9]/g, "");
        setUsername(cleaned);
        if (cleaned.length < 3) setUsernameError(t('settings.account.usernameMinError'));
        else if (cleaned.length > 20) setUsernameError(t('settings.account.usernameMaxError'));
        else setUsernameError("");
    };

    const handlePasswordChange = async (currentPassword, newPassword) => {
        await api.put("/user/password", { currentPassword, newPassword });
    };

    const handleLogoutAll = async () => {
        if (!window.confirm(t('settings.security.logoutAllConfirm'))) return;
        logout();
        navigate("/login");
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm(t('settings.danger.deleteConfirm1'))) return;
        if (!window.confirm(t('settings.danger.deleteConfirm2'))) return;
        try {
            await api.delete("/user/account");
            logout();
            navigate("/");
        } catch (e) { alert(t('settings.danger.deleteError') + ": " + e.message); }
    };

    const handleDownloadData = async () => {
        try {
            const res = await api.get("/chats");
            const url = URL.createObjectURL(new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' }));
            const a = document.createElement('a'); a.href = url; a.download = 'finbot-data.json'; a.click();
        } catch (e) { alert(t('settings.danger.downloadError')); }
    };

    const handleCancelSubscription = async () => {
        setCancelling(true);
        try {
            await api.post("/subscription/cancel", { immediately: false });
            setCancelAtPeriodEnd(true);
            setShowCancelModal(false);
            refetch();
        } catch (err) {
            alert(t('settings.plan.cancelFailed'));
        } finally {
            setCancelling(false);
        }
    };

    // handleLanguageChange removed — language selector in appearance tab uses setLanguage + i18n.changeLanguage directly

    // ==================== RENDER TABS ====================
    const renderTabContent = () => {
        // Shared container class for consistency
        const Card = ({ children, className = "" }) => (
            <div className={`bg-white dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 ${className}`}>
                {children}
            </div>
        );

        switch (activeTab) {
            case "account":
                // Survey data labels for display
                const experienceLabels = { beginner: "Yeni Başlayan", intermediate: "Orta Seviye", advanced: "Uzman" };
                const riskLabels = { conservative: "Muhafazakar", moderate: "Dengeli", aggressive: "Agresif" };
                const goalLabels = { "short-term": "Kısa Vadeli", "long-term": "Uzun Vadeli", retirement: "Emeklilik", income: "Pasif Gelir" };
                const budgetLabels = { "0-1000": "$0 - $1,000", "1000-5000": "$1,000 - $5,000", "5000-10000": "$5,000 - $10,000", "10000+": "$10,000+" };
                const sectorLabels = { tech: "Teknoloji", healthcare: "Sağlık", finance: "Finans", energy: "Enerji", consumer: "Tüketici", industrial: "Sanayi", realestate: "Gayrimenkul", crypto: "Kripto" };

                return (
                    <div>
                        <SectionHeader title="Account Information" description="Manage your personal account details." />
                        <Card>
                            <FormRow label="Username" description="Unique ID." required>
                                <div className="w-full max-w-xs">
                                    <Input value={username} onChange={validateUsername} placeholder="username" />
                                    {usernameError && <p className="mt-1.5 text-xs text-red-500">{usernameError}</p>}
                                </div>
                            </FormRow>
                            <FormRow label="Full Name" description="Display name.">
                                <Input value={fullName} onChange={setFullName} placeholder="John Doe" />
                            </FormRow>
                            <FormRow label="Email" description="Cannot be changed.">
                                <Input value={email} onChange={() => { }} disabled />
                            </FormRow>
                            <FormRow label="Created At"><span className="text-sm text-zinc-500 dark:text-zinc-400">{createdAt}</span></FormRow>
                        </Card>

                        {/* Financial Profile Section - LOCKED */}
                        {profile?.isProfileComplete && profile?.surveyData && (
                            <div className="mt-6">
                                <SectionHeader
                                    title="Finansal Profil"
                                    description="Bu bilgiler bir kez doldurulabilir ve değiştirilemez."
                                />
                                <Card className="relative">
                                    {/* Locked Badge */}
                                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                                        <LockClosedIcon className="w-3.5 h-3.5 text-amber-500" />
                                        <span className="text-xs font-medium text-amber-500">Kilitli</span>
                                    </div>

                                    <FormRow label="Yatırım Deneyimi">
                                        <Input
                                            value={experienceLabels[profile.surveyData.investmentExperience] || "-"}
                                            onChange={() => { }}
                                            disabled
                                        />
                                    </FormRow>
                                    <FormRow label="Risk Toleransı">
                                        <Input
                                            value={riskLabels[profile.surveyData.riskTolerance] || "-"}
                                            onChange={() => { }}
                                            disabled
                                        />
                                    </FormRow>
                                    <FormRow label="Yatırım Hedefi">
                                        <Input
                                            value={goalLabels[profile.surveyData.investmentGoals] || "-"}
                                            onChange={() => { }}
                                            disabled
                                        />
                                    </FormRow>
                                    <FormRow label="Aylık Bütçe">
                                        <Input
                                            value={budgetLabels[profile.surveyData.monthlyBudget] || "-"}
                                            onChange={() => { }}
                                            disabled
                                        />
                                    </FormRow>
                                    {profile.surveyData.preferredSectors?.length > 0 && (
                                        <FormRow label="İlgilenilen Sektörler">
                                            <div className="flex flex-wrap gap-1.5 max-w-xs justify-end">
                                                {profile.surveyData.preferredSectors.map(sector => (
                                                    <span
                                                        key={sector}
                                                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                                    >
                                                        {sectorLabels[sector] || sector}
                                                    </span>
                                                ))}
                                            </div>
                                        </FormRow>
                                    )}
                                </Card>
                            </div>
                        )}
                    </div>
                );

            case "security":
                return (
                    <div>
                        <SectionHeader title="Security Settings" description="Password and login methods." />
                        <Card className="mb-6">
                            <FormRow label="Password">
                                <button onClick={() => setShowPasswordModal(true)} className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-white text-sm font-medium border border-zinc-200 dark:border-zinc-700">Change Password</button>
                            </FormRow>
                            <FormRow label="Login Providers">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                                        <span className="text-sm font-bold text-blue-500">G</span>
                                        <span className="text-sm text-zinc-700 dark:text-zinc-300">Google</span>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${googleConnected ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-zinc-100 text-zinc-500'}`}>
                                        {googleConnected ? 'Connected' : 'Not Connected'}
                                    </span>
                                </div>
                            </FormRow>
                        </Card>
                        <Card>
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Active Sessions</h3>
                            <div className="space-y-3">
                                {sessions.map((s) => (
                                    <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
                                        <div>
                                            <p className="text-sm font-medium text-zinc-900 dark:text-white">{s.device} {s.current && <span className="ml-2 text-xs text-emerald-500 font-bold">Current</span>}</p>
                                            <p className="text-xs text-zinc-500">{s.location}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleLogoutAll} className="mt-4 text-sm text-red-500 hover:text-red-600 font-medium">Logout from all devices</button>
                        </Card>
                    </div>
                );


            case "markets":
                return (
                    <div>
                        <SectionHeader title="Market Preferences" description="Tracking markets." />
                        <Card>
                            <div className="space-y-3">
                                {markets.map((m) => (
                                    <div key={m.id} className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
                                        <div className="flex items-center gap-3">
                                            {m.locked && <LockClosedIcon className="w-4 h-4 text-zinc-400" />}
                                            <span className="text-sm font-medium text-zinc-900 dark:text-white">{m.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-zinc-400">{m.locked ? 'Required' : ''}</span>
                                            <Toggle enabled={m.enabled} onChange={() => { }} disabled={m.locked} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                );

            case "favorites":
                return (
                    <div>
                        <SectionHeader title="Favorite Stocks" description="Watchlist management." />
                        <Card>
                            <TagInput tags={favoriteStocks} onAdd={(t) => setFavoriteStocks([...favoriteStocks, t])} onRemove={(t) => setFavoriteStocks(favoriteStocks.filter(x => x !== t))} />
                        </Card>
                    </div>
                );

            case "analysis":
                return (
                    <div>
                        <SectionHeader title="Analysis" description="Financial analysis settings." />
                        <Card>
                            <FormRow label="Quarterly Earnings"><Toggle enabled={quarterlyEarnings} onChange={setQuarterlyEarnings} /></FormRow>
                            <FormRow label="Annual Financials"><Toggle enabled={annualFinancials} onChange={setAnnualFinancials} /></FormRow>
                            <FormRow label="Charts"><Toggle enabled={showCharts} onChange={setShowCharts} /></FormRow>
                            <FormRow label="Auto Summary"><Toggle enabled={autoSummary} onChange={setAutoSummary} /></FormRow>
                        </Card>
                    </div>
                );

            case "notifications":
                return (
                    <div>
                        <SectionHeader title="Notifications" description="Alert settings." />
                        <Card>
                            <FormRow label="Earnings Alerts"><Toggle enabled={earningsAlerts} onChange={setEarningsAlerts} /></FormRow>
                            <FormRow label="Financial Updates"><Toggle enabled={financialUpdates} onChange={setFinancialUpdates} /></FormRow>
                            <FormRow label="Price Alert %"><Input type="number" value={priceChangePercent} onChange={setPriceChangePercent} className="w-20 text-center" /></FormRow>
                            <FormRow label="Weekly Summary"><Toggle enabled={weeklySummary} onChange={setWeeklySummary} /></FormRow>
                        </Card>
                    </div>
                );

            case "appearance":
                return (
                    <div>
                        <SectionHeader title="Appearance" description="UI customization." />
                        <Card>
                            <FormRow label="Theme">
                                <SegmentedControl options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "system", label: "System" }]} value={theme} onChange={setTheme} />
                            </FormRow>
                            <FormRow label="Number Format">
                                <SegmentedControl options={[{ value: "compact", label: "1.25B" }, { value: "full", label: "Full" }]} value={numberFormat} onChange={setNumberFormat} />
                            </FormRow>
                            <FormRow label="Chart Animations"><Toggle enabled={chartAnimations} onChange={setChartAnimations} /></FormRow>
                        </Card>
                    </div>
                );

            case "plan":
                const queryPercent = dailyLimit > 0 ? (dailyUsage / dailyLimit) * 100 : 0;
                const newsPercent = newsLimit > 0 ? (newsUsage / newsLimit) * 100 : 0;
                const getBarColor = (pct) => pct >= 100 ? 'from-red-500 to-red-400' : pct >= 80 ? 'from-amber-500 to-yellow-400' : 'from-emerald-500 to-emerald-400';
                const renewDateStr = subscriptionEnd ? subscriptionEnd.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null;

                return (
                    <div>
                        <SectionHeader title={t('settings.plan.title')} description={t('settings.plan.description')} />
                        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl border border-zinc-700 p-6 text-white shadow-xl">
                            {/* Plan Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-sm text-zinc-400">{t('settings.plan.currentPlan')}</p>
                                    <p className="text-2xl font-bold mt-1">{currentPlan}</p>
                                    {cancelAtPeriodEnd && renewDateStr && (
                                        <span className="inline-block mt-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
                                            {t('settings.plan.cancelledBadge', { date: renewDateStr })}
                                        </span>
                                    )}
                                </div>
                                {currentPlan !== "PRO" && (
                                    <Link to="/pricing" className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-bold shadow-lg shadow-amber-500/30 transition-all transform hover:scale-105 flex items-center gap-2">
                                        <StarIcon className="w-4 h-4" />
                                        {t('settings.plan.upgradePlan')}
                                    </Link>
                                )}
                            </div>

                            {/* FinBot Queries Progress */}
                            <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700 mb-3">
                                <div className="w-full">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-zinc-400">{t('settings.plan.dailyQueries')}</span>
                                        <span className="text-zinc-300 font-medium">{dailyUsage} / {dailyLimit}</span>
                                    </div>
                                    <div className="h-2.5 bg-zinc-700 rounded-full overflow-hidden">
                                        <div className={`h-full bg-gradient-to-r ${getBarColor(queryPercent)} rounded-full transition-all duration-500`} style={{ width: `${Math.min(queryPercent, 100)}%` }} />
                                    </div>
                                    {queryPercent >= 100 && (
                                        <div className="mt-2 flex items-center justify-between">
                                            <p className="text-xs text-red-400 font-medium">{t('settings.plan.limitReached')}</p>
                                            {currentPlan !== "PRO" && <Link to="/pricing" className="text-xs text-amber-400 hover:text-amber-300 font-bold">{t('settings.plan.upgradePlan')} →</Link>}
                                        </div>
                                    )}
                                    {queryPercent >= 80 && queryPercent < 100 && (
                                        <p className="mt-2 text-xs text-amber-400 font-medium">{t('settings.plan.limitWarning')}</p>
                                    )}
                                </div>
                            </div>

                            {/* News Analysis Progress */}
                            <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700 mb-3">
                                <div className="w-full">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-zinc-400">{t('settings.plan.newsAnalysis')}</span>
                                        <span className="text-zinc-300 font-medium">{newsUsage} / {newsLimit}</span>
                                    </div>
                                    <div className="h-2.5 bg-zinc-700 rounded-full overflow-hidden">
                                        <div className={`h-full bg-gradient-to-r ${getBarColor(newsPercent)} rounded-full transition-all duration-500`} style={{ width: `${Math.min(newsPercent, 100)}%` }} />
                                    </div>
                                    {newsPercent >= 100 && (
                                        <p className="mt-2 text-xs text-red-400 font-medium">{t('settings.plan.limitReached')}</p>
                                    )}
                                    {newsPercent >= 80 && newsPercent < 100 && (
                                        <p className="mt-2 text-xs text-amber-400 font-medium">{t('settings.plan.limitWarning')}</p>
                                    )}
                                </div>
                            </div>

                            {/* Renewal / Reset Info */}
                            <p className="text-xs text-zinc-500 mt-1">
                                {currentPlan === "FREE"
                                    ? t('settings.plan.resetsDaily')
                                    : renewDateStr
                                        ? t('settings.plan.renewsOn', { date: renewDateStr })
                                        : t('settings.plan.resetsDaily')
                                }
                            </p>

                            {/* Cancel Subscription */}
                            {currentPlan !== "FREE" && !cancelAtPeriodEnd && (
                                <div className="mt-6 pt-4 border-t border-zinc-700">
                                    <button
                                        onClick={() => setShowCancelModal(true)}
                                        className="text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
                                    >
                                        {t('settings.plan.cancelSubscription')}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Cancel Subscription Modal */}
                        {showCancelModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm p-4">
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md shadow-2xl">
                                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t('settings.plan.cancelConfirmTitle')}</h2>
                                        <button onClick={() => setShowCancelModal(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                                            <XMarkIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                                            <div className="flex items-start gap-3">
                                                <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm text-amber-700 dark:text-amber-300">{t('settings.plan.cancelConfirmMessage')}</p>
                                                    {renewDateStr && (
                                                        <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mt-2">{t('settings.plan.cancelConfirmEnd', { date: renewDateStr })}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <button onClick={() => setShowCancelModal(false)} className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-white font-medium transition-colors">
                                                {t('settings.plan.goBack')}
                                            </button>
                                            <button onClick={handleCancelSubscription} disabled={cancelling} className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-400 text-white font-medium transition-colors disabled:opacity-50">
                                                {cancelling ? t('settings.plan.cancelling') : t('settings.plan.confirmCancel')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case "danger":
                return (
                    <div>
                        <SectionHeader title="Data & Account" description="Export or delete." />
                        <Card className="mb-6">
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Export</h3>
                            <div className="flex gap-3">
                                <button onClick={handleDownloadData} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-white text-sm border border-zinc-200 dark:border-zinc-700"><ArrowDownTrayIcon className="w-4 h-4" /> Download Data</button>
                            </div>
                        </Card>
                        <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-500/20 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0" />
                                <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">Danger Zone</h3>
                            </div>
                            <button onClick={handleDeleteAccount} className="px-4 py-2 rounded-lg bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-bold border border-red-200 dark:border-red-500/30 hover:bg-red-200 dark:hover:bg-red-500/20">Delete Account</button>
                        </div>
                    </div>
                );

            default: return null;
        }
    };

    if (profileLoading) return <div className="min-h-screen grid place-items-center bg-zinc-50 dark:bg-[#0b0c0f]"><div className="animate-spin w-8 h-8 border-2 border-emerald-500 rounded-full border-t-transparent" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0b0c0f] text-zinc-900 dark:text-white transition-colors duration-300">

            {/* Background Ambient Light */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-[120px]" />
            </div>

            <PasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} onSubmit={handlePasswordChange} />

            <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/chat" className="p-2 rounded-lg bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-white transition-colors">
                            <ArrowLeftIcon className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('settings.title')}</h1>
                            <p className="text-sm text-zinc-500 dark:text-zinc-500">{t('settings.subtitle')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {saveSuccess && <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium"><CheckCircleIcon className="w-5 h-5" /> {t('settings.saved')}</span>}
                        <button
                            onClick={handleSave}
                            disabled={saving || !!usernameError}
                            className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all transform active:scale-95"
                        >
                            {saving ? t('settings.saving') : t('settings.saveChanges')}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Tabs */}
                    <nav className="lg:w-64 shrink-0">
                        <div className="lg:sticky lg:top-8 space-y-1">
                            {TAB_KEYS.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                const isDanger = tab.id === 'danger';
                                const label = t(`settings.tabs.${tab.id}`);
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left
                        ${isActive
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                                                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white'
                                            }
                        ${isDanger ? 'mt-4 border-t border-zinc-200 dark:border-zinc-800 pt-5' : ''}
                      `}
                                    >
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-500' : isDanger && !isActive ? 'text-red-400' : ''}`} />
                                        <span className={isDanger && !isActive ? 'text-red-500 dark:text-red-400' : ''}>{label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </nav>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-20">
                        {renderTabContent()}
                    </div>
                </div>
            </div>
        </div >
    );
}
