import mongoose from "mongoose";

export const ALLOWED_CATEGORIES = [
  "Maaş", "Yatırım", "Ek Gelir", "Freelance", "Kira Geliri", "Diğer",
  "Gıda", "Kira", "Fatura", "Eğlence", "Sağlık", "Ulaşım", "Giyim", "Teknoloji", "Eğitim", "Tatil"
];

const WalletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Finansal Özet
    totalAssets: { type: Number, default: 0 },
    monthlyIncome: { type: Number, default: 0 },
    monthlyExpense: { type: Number, default: 0 },
    savings: { type: Number, default: 0 },
    healthScore: { type: Number, default: 50, min: 0, max: 100 },

    // İşlemler (Yeni Eklenen)
    transactions: [
      {
        type: { type: String, enum: ["income", "expense"], required: true },
        category: { type: String, required: true },
        amount: { type: Number, required: true },
        description: { type: String, default: "" },
        date: { type: Date, default: Date.now },
      },
    ],

    // Birikim Hedefleri
    goals: [
      {
        title: { type: String, required: true },
        target: { type: Number, required: true },
        saved: { type: Number, default: 0 },
        icon: { type: String, default: "💰" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // FinBot Görevleri
    tasks: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        reward: { type: String, default: "+0 Puan" },
        completed: { type: Boolean, default: false },
        icon: { type: String, default: "📋" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // Harcama Kategorileri (Özet)
    expenses: [
      {
        name: { type: String, required: true },
        value: { type: Number, required: true },
        category: { type: String, default: "Diğer" },
      },
    ],
    // Analiz Geçmişi
    analyses: [
      {
        date: { type: Date, default: Date.now },
        monthlyIncome: { type: Number, default: 0 },
        totalExpense: { type: Number, default: 0 },
        transactionCount: { type: Number, default: 0 },
        healthStatus: { type: String, default: "unknown" },
        burnDay: { type: Number, default: 30 },
      },
    ],
  },
  { timestamps: true }
);

// Health Score'u otomatik hesapla
WalletSchema.methods.calculateHealthScore = function () {
  let score = 50; // Base score

  // Tasarruf oranı (40% üzeri = mükemmel)
  if (this.monthlyIncome > 0) {
    const savingsRate = (this.savings / this.monthlyIncome) * 100;
    if (savingsRate >= 40) score += 30;
    else if (savingsRate >= 30) score += 20;
    else if (savingsRate >= 20) score += 10;
    else if (savingsRate >= 10) score += 5;
  }

  // Hedef tamamlanma oranı
  if (this.goals.length > 0) {
    const completedGoals = this.goals.filter(
      (g) => g.saved >= g.target
    ).length;
    score += (completedGoals / this.goals.length) * 10;
  }

  // Görev tamamlanma oranı
  if (this.tasks.length > 0) {
    const completedTasks = this.tasks.filter((t) => t.completed).length;
    score += (completedTasks / this.tasks.length) * 10;
  }

  this.healthScore = Math.min(100, Math.max(0, score));
  return this.healthScore;
};

export default mongoose.model("Wallet", WalletSchema);

