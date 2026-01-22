// PATH: backend/src/routes/portfolioRoutes.js
import express from "express";
import { 
  getPortfolio, 
  addAsset, 
  deleteAsset 
} from "../controllers/portfolioController.js";
import { protect } from "../middleware/auth.js"; // 🔒 Güvenlik Kilidi

const router = express.Router();

// Tüm işlemler korumalıdır (Token gerekir)
router.get("/", protect, getPortfolio);       // Portföyü getir
router.post("/add", protect, addAsset);       // Hisse ekle
router.delete("/:id", protect, deleteAsset);  // Hisse sil

export default router;