import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import PageGuide from "../components/PageGuide";
import {
  WalletIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
  CheckCircleIcon,
  ChartBarIcon,
  CpuChipIcon,
  ArrowRightIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  BanknotesIcon
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleIconSolid } from "@heroicons/react/24/solid";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// Harcama kategorileri için renkler
const expenseColors = {
  "Market": "#14b8a6",
  "Faturalar": "#06b6d4",
  "Eğlence": "#8b5cf6",
  "Ulaşım": "#ec4899",
  "Diğer": "#64748b"
};

// Hedef ikonları
const goalIcons = ["💰", "🏖️", "🚗", "🏠", "✈️", "💍", "📱", "💻", "🎓", "🎁"];

// Demo/Örnek veriler (ilk açılışta gösterilecek)
const demoData = {
  totalAssets: 125000,
  monthlyIncome: 35000,
  monthlyExpense: 21000,
  savings: 14000,
  healthScore: 78,
  expenses: [
    { name: "Market", value: 8500, category: "Market" },
    { name: "Faturalar", value: 5200, category: "Faturalar" },
    { name: "Eğlence", value: 3300, category: "Eğlence" },
    { name: "Ulaşım", value: 2500, category: "Ulaşım" },
    { name: "Diğer", value: 1500, category: "Diğer" }
  ],
  tasks: [
    {
      id: "1",
      title: "Kahve Detoksu",
      description: "Bu hafta dışarıdan kahve içme",
      reward: "+50 Puan",
      completed: false,
      icon: "☕"
    },
    {
      id: "2",
      title: "İlk Bilanço Analizi",
      description: "Aylık harcama raporunu görüntüle",
      reward: "+30 Puan",
      completed: true,
      icon: "📊"
    },
    {
      id: "3",
      title: "Hedef Belirle",
      description: "Yeni bir birikim hedefi oluştur",
      reward: "+25 Puan",
      completed: false,
      icon: "🎯"
    },
    {
      id: "4",
      title: "Otomatik Ödeme Kur",
      description: "Faturaları otomatik ödemeye al",
      reward: "+40 Puan",
      completed: false,
      icon: "⚡"
    }
  ],
  goals: [
    {
      id: "1",
      title: "Yaz Tatili",
      target: 20000,
      saved: 8500,
      icon: "🏖️"
    },
    {
      id: "2",
      title: "Araba",
      target: 150000,
      saved: 45000,
      icon: "🚗"
    },
    {
      id: "3",
      title: "Acil Durum Fonu",
      target: 50000,
      saved: 32000,
      icon: "💰"
    }
  ]
};

// Guide adımları
const guideSteps = [
  {
    title: "Hoş Geldin! 👋",
    description: "FinBot Cüzdan sayfasına hoş geldin. Bu sayfa ile gelir ve giderlerini takip edebilir, birikim hedefleri belirleyebilirsin.",
    icon: "👋"
  },
  {
    title: "Finansal Özet",
    description: "Üst panelde gelir, gider ve toplam varlıklarını görebilir, düzenle butonu ile güncelleyebilirsin.",
    icon: "📊"
  },
  {
    title: "Harcama Analizi",
    description: "Harcamalarını kategorilere göre görüntüleyebilir, hangi alanda daha çok harcama yaptığını takip edebilirsin.",
    icon: "📈"
  },
  {
    title: "Birikim Hedefleri",
    description: "Yeni Hedef butonu ile birikim hedefleri oluşturabilir, ilerlemeni takip edebilirsin.",
    icon: "🎯"
  },
  {
    title: "Görevler",
    description: "FinBot görevlerini tamamlayarak puan kazanabilir ve finansal sağlığını artırabilirsin.",
    icon: "✅"
  }
];

export default function WalletPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // State
  const [wallet, setWallet] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [financeModalOpen, setFinanceModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [showAiBanner, setShowAiBanner] = useState(true);

  // Form states
  const [goalForm, setGoalForm] = useState({ title: "", target: "", icon: "💰" });
  const [financeForm, setFinanceForm] = useState({ monthlyIncome: "", monthlyExpense: "", totalAssets: "" });

  // İlk yüklemede verileri çek
  useEffect(() => {
    loadWalletData();
  }, []);

  const getUserKey = () => {
    if (user?.email) return `finbot_wallet_${user.email}`;
    if (user?._id) return `finbot_wallet_${user._id}`;
    if (user?.id) return `finbot_wallet_${user.id}`;
    return "finbot_wallet_guest";
  };

  const loadWalletData = () => {
    const userKey = getUserKey();
    const savedData = localStorage.getItem(userKey);

    if (savedData) {
      // Kullanıcının kendi verileri var
      setWallet(JSON.parse(savedData));
      setIsDemo(false);
    } else {
      // İlk açılış - demo veriler göster
      setWallet(demoData);
      setIsDemo(true);
    }
  };

  const saveWalletData = (data) => {
    const userKey = getUserKey();
    localStorage.setItem(userKey, JSON.stringify(data));
    setWallet(data);
    setIsDemo(false);
  };

  // Sağlık skoru hesapla
  const calculateHealthScore = (data) => {
    let score = 50;

    if (data.monthlyIncome > 0) {
      const savingsRate = (data.savings / data.monthlyIncome) * 100;
      if (savingsRate >= 40) score += 30;
      else if (savingsRate >= 30) score += 20;
      else if (savingsRate >= 20) score += 10;
      else if (savingsRate >= 10) score += 5;
    }

    if (data.goals && data.goals.length > 0) {
      const completedGoals = data.goals.filter(g => g.saved >= g.target).length;
      score += (completedGoals / data.goals.length) * 10;
    }

    if (data.tasks && data.tasks.length > 0) {
      const completedTasks = data.tasks.filter(t => t.completed).length;
      score += (completedTasks / data.tasks.length) * 10;
    }

    return Math.min(100, Math.max(0, score));
  };

  // Finansal özeti güncelle
  const handleUpdateFinance = () => {
    const newWallet = { ...wallet };

    if (financeForm.monthlyIncome) newWallet.monthlyIncome = parseFloat(financeForm.monthlyIncome);
    if (financeForm.monthlyExpense) newWallet.monthlyExpense = parseFloat(financeForm.monthlyExpense);
    if (financeForm.totalAssets) newWallet.totalAssets = parseFloat(financeForm.totalAssets);

    newWallet.savings = newWallet.monthlyIncome - newWallet.monthlyExpense;
    newWallet.healthScore = calculateHealthScore(newWallet);

    saveWalletData(newWallet);
    setFinanceModalOpen(false);
    setFinanceForm({ monthlyIncome: "", monthlyExpense: "", totalAssets: "" });
    toast.success("Finansal bilgiler güncellendi!");
  };

  // Hedef ekle
  const handleAddGoal = () => {
    if (!goalForm.title || !goalForm.target) {
      toast.error("Lütfen tüm alanları doldurun.");
      return;
    }

    const newWallet = { ...wallet };
    const newGoal = {
      id: editingGoal?.id || Date.now().toString(),
      title: goalForm.title,
      target: parseFloat(goalForm.target),
      saved: editingGoal?.saved || 0,
      icon: goalForm.icon
    };

    if (editingGoal) {
      const index = newWallet.goals.findIndex(g => g.id === editingGoal.id);
      if (index !== -1) {
        newWallet.goals[index] = newGoal;
      }
      toast.success("Hedef güncellendi!");
    } else {
      newWallet.goals.push(newGoal);
      toast.success("Hedef eklendi!");
    }

    newWallet.healthScore = calculateHealthScore(newWallet);
    saveWalletData(newWallet);
    setGoalModalOpen(false);
    setGoalForm({ title: "", target: "", icon: "💰" });
    setEditingGoal(null);
  };

  // Hedef sil
  const handleDeleteGoal = (goalId) => {
    if (!window.confirm("Bu hedefi silmek istediğinize emin misiniz?")) return;

    const newWallet = { ...wallet };
    newWallet.goals = newWallet.goals.filter(g => g.id !== goalId);
    newWallet.healthScore = calculateHealthScore(newWallet);

    saveWalletData(newWallet);
    toast.success("Hedef silindi!");
  };

  // Hedef düzenle
  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setGoalForm({ title: goal.title, target: goal.target.toString(), icon: goal.icon });
    setGoalModalOpen(true);
  };

  // Hedef birikimi güncelle
  const handleUpdateGoalSaved = (goalId, newSaved) => {
    const newWallet = { ...wallet };
    const goal = newWallet.goals.find(g => g.id === goalId);
    if (goal) {
      goal.saved = Math.max(0, parseFloat(newSaved) || 0);
      newWallet.healthScore = calculateHealthScore(newWallet);
      saveWalletData(newWallet);
    }
  };

  // Görev tamamla
  const handleToggleTask = (taskId) => {
    const newWallet = { ...wallet };
    const task = newWallet.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      newWallet.healthScore = calculateHealthScore(newWallet);
      saveWalletData(newWallet);
      toast.success("Görev durumu güncellendi!");
    }
  };

  // Finansal modal aç
  const handleOpenFinanceModal = () => {
    setFinanceForm({
      monthlyIncome: wallet.monthlyIncome?.toString() || "",
      monthlyExpense: wallet.monthlyExpense?.toString() || "",
      totalAssets: wallet.totalAssets?.toString() || ""
    });
    setFinanceModalOpen(true);
  };


  // Yardımcı fonksiyonlar
  const getHealthScoreColor = (score) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-teal-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getHealthScoreLabel = (score) => {
    if (score >= 80) return "Mükemmel";
    if (score >= 60) return "İyi";
    if (score >= 40) return "Orta";
    return "Düşük";
  };

  // Harcama grafiği için veri
  const expenseChartData = wallet?.expenses
    ?.filter((e) => e.value > 0)
    .map((item) => ({
      name: item.name,
      value: item.value,
      color: expenseColors[item.name] || expenseColors["Diğer"]
    })) || [];

  // AI Insight
  const aiInsight = wallet?.savings > 0 ? {
    savings: wallet.savings,
    suggestion: `Tebrikler! Aylık ${wallet.savings.toLocaleString('tr-TR')} TL tasarruf ediyorsun. Bu tutarı yatırıma dönüştürmek ister misin?`,
  } : null;

  if (!wallet) {
    return (
      <div className="min-h-screen bg-[#131314] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#14b8a6]"></div>
      </div>
    );
  }

  const userName = user?.username || "Kullanıcı";
  const healthScore = wallet.healthScore || calculateHealthScore(wallet);

  return (
    <div className="min-h-screen bg-[#131314] text-white pb-20">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1f2937', color: '#fff' } }} />

      {/* GUIDE */}
      <PageGuide
        guideKey="finbot_wallet_guide"
        steps={guideSteps}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">

        {/* === HEADER (Compact Mobile) === */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h1 className="text-lg md:text-3xl font-bold text-white">
              Hoş geldin, {userName.split(' ')[0]} 👋
            </h1>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#151921] border border-gray-800 ${getHealthScoreColor(healthScore)}`}>
            <span>Skor: {healthScore}</span>
            <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
          </div>
        </div>

        {/* --- Demo Badge (Smaller on Mobile) --- */}
        {isDemo && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3">
            <SparklesIcon className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-[11px] md:text-sm text-gray-400">
              <span className="text-emerald-400 font-bold">Örnek Modu:</span> Kendi verilerini eklemek için düzenleyebilirsin.
            </p>
          </div>
        )}

        {/* === FINANCIAL SUMMARY (2x2 Compact) === */}
        <div className="bg-[#151921] rounded-2xl p-5 md:p-8 border border-gray-800 mb-6 md:mb-8 hover:border-[#14b8a6]/20 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">Toplam Varlık</p>
              <p className="text-2xl md:text-4xl font-black text-white">
                ₺{wallet.totalAssets?.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || "0"}
              </p>
            </div>
            <button
              onClick={handleOpenFinanceModal}
              className="p-2.5 bg-gray-800/50 text-gray-400 hover:text-[#14b8a6] rounded-xl transition"
            >
              <PencilSquareIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0f1218] rounded-xl p-3 border border-gray-800/50">
              <div className="flex items-center gap-2 mb-1">
                <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-400" />
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Gelir</p>
              </div>
              <p className="text-sm md:text-base font-bold text-emerald-400">
                ₺{wallet.monthlyIncome?.toLocaleString('tr-TR') || "0"}
              </p>
            </div>
            <div className="bg-[#0f1218] rounded-xl p-3 border border-gray-800/50">
              <div className="flex items-center gap-2 mb-1">
                <ArrowTrendingDownIcon className="w-4 h-4 text-rose-400" />
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Gider</p>
              </div>
              <p className="text-sm md:text-base font-bold text-rose-400">
                ₺{wallet.monthlyExpense?.toLocaleString('tr-TR') || "0"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 justify-center">
            <div className="h-1 w-1 rounded-full bg-emerald-500" />
            <p className="text-[10px] text-gray-500">Aylık Tasarruf: <span className="text-emerald-400 font-medium">₺{wallet.savings?.toLocaleString('tr-TR')}</span></p>
          </div>
        </div>

        {/* === MAIN CONTENT GRID (Summary + Analysis) === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Financial Summary is already above or we can move it back in if needed. 
               The prompt asked for a Slim top bar and a Single Compact Card. 
               I'll keep them as blocks. */}

          {/* Harcama Analizi (Refactored to Donut) */}
          <div className="lg:col-span-1 bg-[#151921] rounded-2xl p-6 border border-gray-800 hover:border-[#14b8a6]/20 transition-all">
            <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
              <ChartBarIcon className="w-4 h-4 text-[#14b8a6]" />
              Harcama Analizi
            </h3>
            {expenseChartData.length > 0 ? (
              <div className="flex flex-col items-center">
                <div className="h-40 w-full mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expenseChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => `₺${value.toLocaleString('tr-TR')}`}
                        contentStyle={{
                          backgroundColor: '#151921',
                          border: '1px solid #374151',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Compact 2-Column Legend */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full">
                  {expenseChartData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-gray-400 truncate">{item.name}</span>
                      </div>
                      <span className="text-gray-200 font-medium ml-1">
                        %{((item.value / wallet.monthlyExpense) * 100).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-500 text-xs text-center border border-dashed border-gray-800 rounded-xl">
                <p>Henüz harcama verisi yok</p>
              </div>
            )}
          </div>
        </div>

        {/* === TASKS (Horizontal Carousel) === */}
        <div className="mb-8 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-xl font-bold text-white flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-[#14b8a6]" />
              FinBot Görevleri
            </h2>
          </div>

          {/* Horizontal Swipe Carousel */}
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">
            {wallet.tasks?.map((task) => (
              <div
                key={task.id}
                onClick={() => handleToggleTask(task.id)}
                className={`flex-none w-40 h-44 bg-[#151921] rounded-2xl p-4 border snap-start cursor-pointer transition-all ${task.completed
                  ? "border-emerald-500/50 bg-emerald-500/5 opacity-80"
                  : "border-gray-800 hover:border-[#14b8a6]/30"
                  }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="text-3xl filter grayscale-[0.5] group-hover:grayscale-0">{task.icon}</div>
                  {task.completed && <CheckCircleIconSolid className="w-5 h-5 text-emerald-400" />}
                </div>
                <div className="h-16 flex flex-col justify-center">
                  <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight mb-1">{task.title}</h3>
                  <p className="text-[10px] text-gray-500 line-clamp-1">{task.description}</p>
                </div>
                <div className="mt-4">
                  <span className="text-[10px] font-bold bg-[#14b8a6]/10 text-[#14b8a6] px-2 py-1 rounded-lg">
                    {task.reward}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* === SAVINGS GOALS (Stack Vertical) === */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base md:text-xl font-bold text-white flex items-center gap-2">
              <WalletIcon className="w-5 h-5 text-[#14b8a6]" />
              Birikim Hedeflerim
            </h2>
            <button
              onClick={() => {
                setEditingGoal(null);
                setGoalForm({ title: "", target: "", icon: "💰" });
                setGoalModalOpen(true);
              }}
              className="p-2 md:px-4 md:py-2 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-xl transition"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>

          {wallet.goals && wallet.goals.length > 0 ? (
            <div className="space-y-4">
              {wallet.goals.map((goal) => {
                const percentage = goal.target > 0 ? (goal.saved / goal.target) * 100 : 0;
                return (
                  <div
                    key={goal.id}
                    className="bg-[#151921] rounded-2xl p-4 border border-gray-800 hover:border-[#14b8a6]/20 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3 text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{goal.icon}</span>
                        <h3 className="text-sm font-bold truncate max-w-[150px]">{goal.title}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500">Hedef: <span className="text-gray-300 font-bold">₺{goal.target.toLocaleString('tr-TR')}</span></p>
                      </div>
                    </div>

                    {/* Thin Progress Bar */}
                    <div className="w-full bg-[#0f1218] rounded-full h-1.5 overflow-hidden mb-3">
                      <div
                        className="h-full bg-gradient-to-r from-[#14b8a6] to-[#06b6d4] rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <p className="text-[10px] text-[#14b8a6] font-bold">₺{goal.saved.toLocaleString('tr-TR')} birikti</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditGoal(goal)}
                          className="text-gray-500 hover:text-white transition p-1"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="text-gray-500 hover:text-rose-400 transition p-1"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#151921] rounded-2xl p-10 border border-dashed border-gray-800 text-center">
              <p className="text-gray-500 text-sm mb-4">Henüz birikim hedefiniz yok.</p>
              <button
                onClick={() => {
                  setEditingGoal(null);
                  setGoalForm({ title: "", target: "", icon: "💰" });
                  setGoalModalOpen(true);
                }}
                className="px-6 py-2 bg-gray-800 text-white rounded-xl text-sm font-bold hover:bg-gray-700 transition"
              >
                Hedef Oluştur
              </button>
            </div>
          )}
        </div>

        {/* === STICKY AI INSIGHT (Bottom Banner) === */}
        {aiInsight && showAiBanner && (
          <div className="fixed bottom-20 left-4 right-4 md:relative md:bottom-0 md:left-0 md:right-0 z-40 mb-4">
            <div className="bg-[#151921] rounded-2xl p-4 border border-purple-500/30 shadow-2xl shadow-purple-500/10 backdrop-blur-md relative">
              <button
                onClick={() => setShowAiBanner(false)}
                className="absolute -top-2 -right-2 bg-gray-800 text-gray-400 p-1 rounded-full border border-gray-700 hover:text-white transition"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
              <div className="flex items-start gap-4">
                <div className="bg-purple-500/10 p-2 rounded-xl mt-1">
                  <SparklesIcon className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Akıllı Öneri</h3>
                    <button onClick={() => navigate("/portfolio")} className="text-[10px] font-bold text-white flex items-center gap-1 shrink-0">
                      Portföy'e Git <ArrowRightIcon className="w-3 h-3 text-purple-400" />
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-tight line-clamp-2">
                    {aiInsight.suggestion}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* HEDEF MODAL */}
      {
        goalModalOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e293b] p-8 rounded-3xl w-full max-w-md shadow-2xl border border-gray-700 relative">
              <button
                onClick={() => {
                  setGoalModalOpen(false);
                  setEditingGoal(null);
                  setGoalForm({ title: "", target: "", icon: "💰" });
                }}
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold mb-6 text-white">
                {editingGoal ? "Hedefi Düzenle" : "Yeni Hedef Ekle"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Başlık</label>
                  <input
                    type="text"
                    placeholder="Örn: Yaz Tatili"
                    value={goalForm.title}
                    onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#0f172a] text-white border border-gray-700 focus:border-[#14b8a6] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Hedef Tutar (₺)</label>
                  <input
                    type="number"
                    placeholder="20000"
                    value={goalForm.target}
                    onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#0f172a] text-white border border-gray-700 focus:border-[#14b8a6] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">İkon</label>
                  <div className="flex flex-wrap gap-2">
                    {goalIcons.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setGoalForm({ ...goalForm, icon })}
                        className={`w-12 h-12 text-2xl rounded-xl border-2 transition ${goalForm.icon === icon
                          ? "border-[#14b8a6] bg-[#14b8a6]/20"
                          : "border-gray-700 hover:border-gray-600"
                          }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddGoal}
                className="w-full mt-8 px-4 py-3.5 rounded-xl bg-[#14b8a6] hover:bg-[#0d9488] text-white font-bold transition"
              >
                {editingGoal ? "Güncelle" : "Ekle"}
              </button>
            </div>
          </div>
        )
      }

      {/* FİNANSAL MODAL */}
      {
        financeModalOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e293b] p-8 rounded-3xl w-full max-w-md shadow-2xl border border-gray-700 relative">
              <button
                onClick={() => {
                  setFinanceModalOpen(false);
                  setFinanceForm({ monthlyIncome: "", monthlyExpense: "", totalAssets: "" });
                }}
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                <BanknotesIcon className="w-6 h-6 text-[#14b8a6]" />
                Finansal Özeti Güncelle
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Aylık Gelir (₺)</label>
                  <input
                    type="number"
                    placeholder="35000"
                    value={financeForm.monthlyIncome}
                    onChange={(e) => setFinanceForm({ ...financeForm, monthlyIncome: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#0f172a] text-white border border-gray-700 focus:border-[#14b8a6] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Aylık Gider (₺)</label>
                  <input
                    type="number"
                    placeholder="21000"
                    value={financeForm.monthlyExpense}
                    onChange={(e) => setFinanceForm({ ...financeForm, monthlyExpense: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#0f172a] text-white border border-gray-700 focus:border-[#14b8a6] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Toplam Varlık (₺)</label>
                  <input
                    type="number"
                    placeholder="125000"
                    value={financeForm.totalAssets}
                    onChange={(e) => setFinanceForm({ ...financeForm, totalAssets: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#0f172a] text-white border border-gray-700 focus:border-[#14b8a6] outline-none transition"
                  />
                </div>
              </div>

              <button
                onClick={handleUpdateFinance}
                className="w-full mt-8 px-4 py-3.5 rounded-xl bg-[#14b8a6] hover:bg-[#0d9488] text-white font-bold transition"
              >
                Güncelle
              </button>
            </div>
          </div>
        )
      }

    </div >
  );
}
