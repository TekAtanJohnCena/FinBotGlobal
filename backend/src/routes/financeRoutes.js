// PATH: backend/src/routes/financeRoutes.js
/**
 * Personal Finance Routes
 * PDF upload + AI analysis + DB persistence + report history
 */

import express from "express";
import multer from "multer";
import { extractTextFromPDF, cleanPdfText, truncateForAI } from "../services/pdfService.js";
import { parseStatementWithAI, generateSavingsRecommendations, calculateFinancialMetrics } from "../services/financeAnalysisService.js";
import FinanceReport from "../models/FinanceReport.js";

const router = express.Router();

// Multer config: PDF only, max 25MB, memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB — supports 20+ page statements
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Sadece PDF dosyaları kabul edilir."), false);
        }
    }
});

/**
 * POST /upload-statement
 * Upload PDF → parse with AI → calculate metrics → save to DB → return
 */
router.post("/upload-statement", (req, res) => {
    upload.single("statement")(req, res, async (multerErr) => {
        try {
            if (multerErr) {
                console.error("[Finance] Multer error:", multerErr.message);
                if (multerErr.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).json({ success: false, message: "Dosya boyutu 25MB'ı aşıyor." });
                }
                return res.status(400).json({ success: false, message: multerErr.message || "Dosya yükleme hatası." });
            }

            if (!req.file) {
                return res.status(400).json({ success: false, message: "PDF dosyası bulunamadı." });
            }

            const startTime = Date.now();
            console.log(`[Finance] PDF received: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);

            // Step 1: Extract text
            let rawText;
            try {
                rawText = await extractTextFromPDF(req.file.buffer);
            } catch (pdfErr) {
                return res.status(400).json({ success: false, message: "PDF okunamadı. Lütfen geçerli bir PDF yükleyin." });
            }

            if (!rawText || rawText.trim().length < 50) {
                return res.status(400).json({ success: false, message: "PDF'den yeterli metin çıkarılamadı. Metin tabanlı PDF yükleyin." });
            }

            // Step 2: Clean + truncate
            const cleanedText = cleanPdfText(rawText);
            const truncatedText = truncateForAI(cleanedText, 20000);
            console.log(`[Finance] Text: ${rawText.length} → clean: ${cleanedText.length} → AI: ${truncatedText.length} chars`);

            // Step 3: Parse with AI
            let parsedData;
            try {
                parsedData = await parseStatementWithAI(truncatedText);
                console.log(`[Finance] Parsed ${parsedData.transactions?.length || 0} transactions`);
            } catch (aiErr) {
                console.error("[Finance] AI parse failed:", aiErr.message);
                return res.status(500).json({ success: false, message: "AI analizi başarısız. Tekrar deneyin." });
            }

            // Step 4: Calculate metrics (server-side, instant)
            const monthlyIncome = req.body?.monthlyIncome ? Number(req.body.monthlyIncome) : null;
            const metrics = calculateFinancialMetrics(parsedData, monthlyIncome);

            // Step 5: Generate recommendations (parallel with save prep)
            let recommendations;
            try {
                recommendations = await generateSavingsRecommendations(parsedData, monthlyIncome);
            } catch (recErr) {
                console.error("[Finance] Recommendation failed:", recErr.message);
                recommendations = "Öneriler şu an üretilemedi.";
            }

            // Step 6: Save to DB (if user is authenticated)
            let savedReport = null;
            if (req.user?._id) {
                try {
                    savedReport = await FinanceReport.create({
                        user: req.user._id,
                        bankName: parsedData.bankName || "Bilinmiyor",
                        period: parsedData.period || "Bilinmiyor",
                        currency: parsedData.currency || "TRY",
                        fileName: req.file.originalname || "",
                        transactions: parsedData.transactions || [],
                        summary: parsedData.summary,
                        metrics,
                        recommendations,
                        monthlyIncomeInput: monthlyIncome || 0,
                    });
                    console.log(`[Finance] Report saved: ${savedReport._id}`);
                } catch (saveErr) {
                    console.error("[Finance] Save failed:", saveErr.message);
                    // Non-critical — still return results
                }
            }

            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`[Finance] ✅ Complete in ${elapsed}s`);

            res.json({
                success: true,
                data: {
                    _id: savedReport?._id || null,
                    bankName: parsedData.bankName || "Bilinmiyor",
                    period: parsedData.period || "Bilinmiyor",
                    currency: parsedData.currency || "TRY",
                    summary: parsedData.summary,
                    metrics,
                    transactions: parsedData.transactions || [],
                    recommendations,
                    createdAt: savedReport?.createdAt || new Date(),
                }
            });

        } catch (error) {
            console.error("[Finance] Unexpected error:", error.message, error.stack);
            res.status(500).json({ success: false, message: "Beklenmeyen hata: " + error.message });
        }
    });
});

/**
 * GET /reports
 * List all saved finance reports for the current user (newest first)
 */
router.get("/reports", async (req, res) => {
    try {
        const reports = await FinanceReport.find({ user: req.user._id })
            .select("bankName period fileName summary metrics.expenseRatio metrics.savingsRate metrics.expenseClass metrics.income metrics.expense createdAt")
            .sort({ createdAt: -1 })
            .limit(24) // Max 2 years of monthly reports
            .lean();

        res.json({ success: true, data: reports });
    } catch (error) {
        console.error("[Finance] List reports error:", error.message);
        res.status(500).json({ success: false, message: "Raporlar yüklenemedi." });
    }
});

/**
 * GET /reports/:id
 * Get a single finance report with full data
 */
router.get("/reports/:id", async (req, res) => {
    try {
        const report = await FinanceReport.findOne({
            _id: req.params.id,
            user: req.user._id,
        }).lean();

        if (!report) {
            return res.status(404).json({ success: false, message: "Rapor bulunamadı." });
        }

        res.json({ success: true, data: report });
    } catch (error) {
        console.error("[Finance] Get report error:", error.message);
        res.status(500).json({ success: false, message: "Rapor yüklenemedi." });
    }
});

/**
 * DELETE /reports/:id
 * Delete a finance report
 */
router.delete("/reports/:id", async (req, res) => {
    try {
        const result = await FinanceReport.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!result) {
            return res.status(404).json({ success: false, message: "Rapor bulunamadı." });
        }

        res.json({ success: true, message: "Rapor silindi." });
    } catch (error) {
        console.error("[Finance] Delete report error:", error.message);
        res.status(500).json({ success: false, message: "Rapor silinemedi." });
    }
});

export default router;
