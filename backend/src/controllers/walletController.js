import Wallet from "../models/Wallet.js";
import { ALLOWED_CATEGORIES } from "../models/Wallet.js";

// Kullanıcının wallet'ını getir veya oluştur
const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });

  if (!wallet) {
    wallet = await Wallet.create({ user: userId });
  }

  return wallet;
};

// GET /api/wallet - Wallet verilerini getir
export const getWallet = async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user._id);
    wallet.calculateHealthScore();
    await wallet.save();

    res.json({ success: true, wallet });
  } catch (error) {
    console.error("Wallet get error:", error);
    res.status(500).json({ success: false, message: "Wallet verileri alınamadı.", error: error.message });
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

    res.json({ success: true, wallet });
  } catch (error) {
    console.error("Wallet update error:", error);
    res.status(500).json({ success: false, message: "Wallet güncellenemedi.", error: error.message });
  }
};

// POST /api/wallet/transactions - Gelir veya gider ekle
export const addTransaction = async (req, res) => {
  try {
    const { type, category, amount, description, date } = req.body;

    // Validation
    if (!type || !category || amount === undefined) {
      return res.status(400).json({ message: "Tür, kategori ve tutar zorunludur." });
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({ message: "Tür 'income' veya 'expense' olmalıdır." });
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({
        message: `Geçersiz kategori. İzin verilenler: ${ALLOWED_CATEGORIES.join(", ")}`,
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({ message: "Tutar sıfırdan büyük olmalıdır." });
    }

    const wallet = await getOrCreateWallet(req.user._id);

    wallet.transactions.push({
      type,
      category,
      amount: Number(amount),
      description: description || "",
      date: date ? new Date(date) : new Date(),
    });

    // Toplam gelir/gider hesapla
    recalculateTotals(wallet);
    wallet.calculateHealthScore();
    await wallet.save();

    res.status(201).json({ success: true, transactions: wallet.transactions, wallet });
  } catch (error) {
    console.error("Transaction add error:", error);
    res.status(500).json({ success: false, message: "İşlem eklenemedi.", error: error.message });
  }
};

// DELETE /api/wallet/transactions/:transactionId - İşlem sil
export const deleteTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const wallet = await getOrCreateWallet(req.user._id);
    const txn = wallet.transactions.id(transactionId);

    if (!txn) {
      return res.status(404).json({ message: "İşlem bulunamadı." });
    }

    txn.deleteOne();

    // Toplam gelir/gider hesapla
    recalculateTotals(wallet);
    wallet.calculateHealthScore();
    await wallet.save();

    res.json({ success: true, transactions: wallet.transactions, wallet });
  } catch (error) {
    console.error("Transaction delete error:", error);
    res.status(500).json({ success: false, message: "İşlem silinemedi.", error: error.message });
  }
};

// GET /api/wallet/transactions - İşlemleri listele (opsiyonel filtre)
export const getTransactions = async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user._id);
    let transactions = [...wallet.transactions];

    // Filtreler
    const { type, category, startDate, endDate } = req.query;

    if (type) {
      transactions = transactions.filter((t) => t.type === type);
    }
    if (category) {
      transactions = transactions.filter((t) => t.category === category);
    }
    if (startDate) {
      transactions = transactions.filter((t) => new Date(t.date) >= new Date(startDate));
    }
    if (endDate) {
      transactions = transactions.filter((t) => new Date(t.date) <= new Date(endDate));
    }

    // Tarihe göre sırala (en yeni önce)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      transactions,
      totalIncome: transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      totalExpense: transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    });
  } catch (error) {
    console.error("Transactions list error:", error);
    res.status(500).json({ success: false, message: "İşlemler alınamadı.", error: error.message });
  }
};

// GET /api/wallet/categories - Mevcut kategorileri getir
export const getCategories = (req, res) => {
  res.json({ categories: ALLOWED_CATEGORIES });
};

// POST /api/wallet/goals - Yeni hedef ekle
export const addGoal = async (req, res) => {
  try {
    const { title, target, icon } = req.body;
    const wallet = await getOrCreateWallet(req.user._id);

    wallet.goals.push({
      title,
      target,
      icon: icon || "💰",
      saved: 0
    });

    wallet.calculateHealthScore();
    await wallet.save();

    res.status(201).json({ success: true, wallet });
  } catch (error) {
    res.status(500).json({ success: false, message: "Hedef eklenemedi.", error: error.message });
  }
};

// PUT /api/wallet/goals/:goalId - Hedef güncelle
export const updateGoal = async (req, res) => {
  try {
    const { goalId } = req.params;
    const { saved } = req.body;

    const wallet = await getOrCreateWallet(req.user._id);
    const goal = wallet.goals.id(goalId);

    if (!goal) return res.status(404).json({ message: "Hedef bulunamadı." });

    if (saved !== undefined) goal.saved = saved;

    wallet.calculateHealthScore();
    await wallet.save();

    res.json({ success: true, wallet });
  } catch (error) {
    res.status(500).json({ success: false, message: "Hedef güncellenemedi.", error: error.message });
  }
};

// DELETE /api/wallet/goals/:goalId - Hedef sil
export const deleteGoal = async (req, res) => {
  try {
    const { goalId } = req.params;
    const wallet = await getOrCreateWallet(req.user._id);

    wallet.goals = wallet.goals.filter(g => g._id.toString() !== goalId);

    wallet.calculateHealthScore();
    await wallet.save();

    res.json({ success: true, wallet });
  } catch (error) {
    res.status(500).json({ success: false, message: "Hedef silinemedi.", error: error.message });
  }
};

// PUT /api/wallet/tasks/:taskId - Görev durumu değiştir
export const toggleTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const wallet = await getOrCreateWallet(req.user._id);
    const task = wallet.tasks.id(taskId);

    if (!task) return res.status(404).json({ message: "Görev bulunamadı." });

    task.completed = !task.completed;

    wallet.calculateHealthScore();
    await wallet.save();

    res.json({ success: true, wallet });
  } catch (error) {
    res.status(500).json({ success: false, message: "Görev güncellenemedi.", error: error.message });
  }
};

// POST /api/wallet/expenses - Harcama Kategorisi Ekle/Güncelle
export const updateExpense = async (req, res) => {
  try {
    const { name, value, category } = req.body;
    const wallet = await getOrCreateWallet(req.user._id);

    // Varsa güncelle, yoksa ekle
    const existing = wallet.expenses.find(e => e.name === name);
    if (existing) {
      existing.value = value;
      existing.category = category || existing.category;
    } else {
      wallet.expenses.push({ name, value, category });
    }

    wallet.calculateHealthScore();
    await wallet.save();

    res.json({ success: true, wallet });
  } catch (error) {
    res.status(500).json({ success: false, message: "Harcama güncellenemedi.", error: error.message });
  }
};

// Helper: Toplam gelir/gider yeniden hesapla
function recalculateTotals(wallet) {
  const income = wallet.transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = wallet.transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  wallet.monthlyIncome = income;
  wallet.monthlyExpense = expense;
  wallet.savings = income - expense;
}
