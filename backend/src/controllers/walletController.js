import Wallet from "../models/Wallet.js";

// Kullanıcının wallet'ını getir veya oluştur
const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });
  
  if (!wallet) {
    // Varsayılan görevler
    const defaultTasks = [
      {
        title: "Kahve Detoksu",
        description: "Bu hafta dışarıdan kahve içme",
        reward: "+50 Puan",
        completed: false,
        icon: "☕",
      },
      {
        title: "İlk Bilanço Analizi",
        description: "Aylık harcama raporunu görüntüle",
        reward: "+30 Puan",
        completed: false,
        icon: "📊",
      },
      {
        title: "Hedef Belirle",
        description: "Yeni bir birikim hedefi oluştur",
        reward: "+25 Puan",
        completed: false,
        icon: "🎯",
      },
      {
        title: "Otomatik Ödeme Kur",
        description: "Faturaları otomatik ödemeye al",
        reward: "+40 Puan",
        completed: false,
        icon: "⚡",
      },
    ];

    // Varsayılan harcamalar
    const defaultExpenses = [
      { name: "Market", value: 0, category: "Market" },
      { name: "Faturalar", value: 0, category: "Faturalar" },
      { name: "Eğlence", value: 0, category: "Eğlence" },
      { name: "Ulaşım", value: 0, category: "Ulaşım" },
      { name: "Diğer", value: 0, category: "Diğer" },
    ];

    wallet = await Wallet.create({
      user: userId,
      tasks: defaultTasks,
      expenses: defaultExpenses,
    });
    wallet.calculateHealthScore();
    await wallet.save();
  }
  
  return wallet;
};

// GET /api/wallet - Wallet verilerini getir
export const getWallet = async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user._id);
    wallet.calculateHealthScore();
    await wallet.save();
    
    res.json(wallet);
  } catch (error) {
    console.error("Wallet get error:", error);
    res.status(500).json({ message: "Wallet verileri alınamadı.", error: error.message });
  }
};

// PUT /api/wallet - Finansal özeti güncelle (gelir, gider, varlık)
export const updateWallet = async (req, res) => {
  try {
    const { monthlyIncome, monthlyExpense, totalAssets } = req.body;
    
    const wallet = await getOrCreateWallet(req.user._id);
    
    if (monthlyIncome !== undefined) wallet.monthlyIncome = monthlyIncome;
    if (monthlyExpense !== undefined) wallet.monthlyExpense = monthlyExpense;
    if (totalAssets !== undefined) wallet.totalAssets = totalAssets;
    
    wallet.savings = wallet.monthlyIncome - wallet.monthlyExpense;
    wallet.calculateHealthScore();
    await wallet.save();
    
    res.json(wallet);
  } catch (error) {
    console.error("Wallet update error:", error);
    res.status(500).json({ message: "Wallet güncellenemedi.", error: error.message });
  }
};

// POST /api/wallet/goals - Yeni hedef ekle
export const addGoal = async (req, res) => {
  try {
    const { title, target, icon } = req.body;
    
    if (!title || !target) {
      return res.status(400).json({ message: "Başlık ve hedef tutarı zorunludur." });
    }
    
    const wallet = await getOrCreateWallet(req.user._id);
    
    wallet.goals.push({
      title,
      target: Number(target),
      saved: 0,
      icon: icon || "💰",
    });
    
    wallet.calculateHealthScore();
    await wallet.save();
    
    res.status(201).json(wallet);
  } catch (error) {
    console.error("Goal add error:", error);
    res.status(500).json({ message: "Hedef eklenemedi.", error: error.message });
  }
};

// PUT /api/wallet/goals/:goalId - Hedefi güncelle
export const updateGoal = async (req, res) => {
  try {
    const { goalId } = req.params;
    const { title, target, saved, icon } = req.body;
    
    const wallet = await getOrCreateWallet(req.user._id);
    const goal = wallet.goals.id(goalId);
    
    if (!goal) {
      return res.status(404).json({ message: "Hedef bulunamadı." });
    }
    
    if (title !== undefined) goal.title = title;
    if (target !== undefined) goal.target = Number(target);
    if (saved !== undefined) goal.saved = Number(saved);
    if (icon !== undefined) goal.icon = icon;
    
    wallet.calculateHealthScore();
    await wallet.save();
    
    res.json(wallet);
  } catch (error) {
    console.error("Goal update error:", error);
    res.status(500).json({ message: "Hedef güncellenemedi.", error: error.message });
  }
};

// DELETE /api/wallet/goals/:goalId - Hedefi sil
export const deleteGoal = async (req, res) => {
  try {
    const { goalId } = req.params;
    
    const wallet = await getOrCreateWallet(req.user._id);
    wallet.goals.id(goalId)?.remove();
    
    wallet.calculateHealthScore();
    await wallet.save();
    
    res.json(wallet);
  } catch (error) {
    console.error("Goal delete error:", error);
    res.status(500).json({ message: "Hedef silinemedi.", error: error.message });
  }
};

// PUT /api/wallet/tasks/:taskId - Görevi tamamla/tamamlanmıştan çıkar
export const toggleTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const wallet = await getOrCreateWallet(req.user._id);
    const task = wallet.tasks.id(taskId);
    
    if (!task) {
      return res.status(404).json({ message: "Görev bulunamadı." });
    }
    
    task.completed = !task.completed;
    
    wallet.calculateHealthScore();
    await wallet.save();
    
    res.json(wallet);
  } catch (error) {
    console.error("Task toggle error:", error);
    res.status(500).json({ message: "Görev güncellenemedi.", error: error.message });
  }
};

// POST /api/wallet/expenses - Harcama ekle/güncelle
export const updateExpense = async (req, res) => {
  try {
    const { name, value, category } = req.body;
    
    if (!name || value === undefined) {
      return res.status(400).json({ message: "Harcama adı ve tutarı zorunludur." });
    }
    
    const wallet = await getOrCreateWallet(req.user._id);
    
    // Aynı isimde harcama varsa güncelle, yoksa ekle
    const existingExpense = wallet.expenses.find((e) => e.name === name);
    
    if (existingExpense) {
      existingExpense.value = Number(value);
      if (category) existingExpense.category = category;
    } else {
      wallet.expenses.push({
        name,
        value: Number(value),
        category: category || "Diğer",
      });
    }
    
    // Toplam gideri hesapla
    wallet.monthlyExpense = wallet.expenses.reduce((sum, e) => sum + e.value, 0);
    wallet.savings = wallet.monthlyIncome - wallet.monthlyExpense;
    
    wallet.calculateHealthScore();
    await wallet.save();
    
    res.json(wallet);
  } catch (error) {
    console.error("Expense update error:", error);
    res.status(500).json({ message: "Harcama güncellenemedi.", error: error.message });
  }
};

