import express from "express";
import {
  getWallet,
  updateWallet,
  addGoal,
  updateGoal,
  deleteGoal,
  toggleTask,
  updateExpense,
} from "../controllers/walletController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Tüm route'lar korumalı
router.use(protect);

// GET /api/wallet - Wallet verilerini getir
router.get("/", getWallet);

// PUT /api/wallet - Finansal özeti güncelle
router.put("/", updateWallet);

// POST /api/wallet/goals - Yeni hedef ekle
router.post("/goals", addGoal);

// PUT /api/wallet/goals/:goalId - Hedefi güncelle
router.put("/goals/:goalId", updateGoal);

// DELETE /api/wallet/goals/:goalId - Hedefi sil
router.delete("/goals/:goalId", deleteGoal);

// PUT /api/wallet/tasks/:taskId - Görevi tamamla/tamamlanmıştan çıkar
router.put("/tasks/:taskId", toggleTask);

// POST /api/wallet/expenses - Harcama ekle/güncelle
router.post("/expenses", updateExpense);

export default router;

