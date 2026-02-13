// PATH: backend/src/routes/financeAnalysisRoutes.js
// Finance Analysis API Routes
// -----------------------------------------------------------

import express from "express";
import { protect } from "../middleware/auth.js";
import {
    analyzeStatement,
    analyzeManual,
    getCategories,
    uploadMiddleware,
} from "../controllers/financeAnalysisController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// POST /api/wallet/analyze - Upload PDF + income → full analysis
// Wrap multer middleware to catch multer-specific errors gracefully
router.post("/analyze", (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
        if (err) {
            console.error("[Multer Error]", err.message);
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({ message: "Dosya boyutu çok büyük. Maksimum 10MB." });
            }
            return res.status(400).json({ message: err.message || "Dosya yükleme hatası." });
        }
        next();
    });
}, analyzeStatement);

// POST /api/wallet/analyze-manual - Manual transactions analysis
router.post("/analyze-manual", analyzeManual);

// GET /api/wallet/categories - Get category rules
router.get("/categories", getCategories);

export default router;
