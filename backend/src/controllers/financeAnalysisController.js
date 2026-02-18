// PATH: backend/src/controllers/financeAnalysisController.js
// Finance Analysis API Controller
// -----------------------------------------------------------

import multer from "multer";
import {
    extractTransactionsFromPDF,
    runFullAnalysis,
    CATEGORY_RULES,
    normalizeTransactions,
} from "../services/financeAnalysisService.js";
import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";

// Multer config - memory storage for PDF
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Sadece PDF dosyaları kabul edilir."), false);
        }
    },
});

export const uploadMiddleware = upload.single("statement");

/**
 * POST /api/wallet/analyze
 * PDF upload + gelir bilgisi → tam analiz sonucu
 */
export const analyzeStatement = async (req, res) => {
    try {
        console.log("[Analyze] === START ===");
        console.log("[Analyze] req.file:", req.file ? `${req.file.originalname} (${req.file.size} bytes)` : "NO FILE");
        console.log("[Analyze] req.body:", JSON.stringify(req.body));
        console.log("[Analyze] req.body.monthlyIncome:", req.body?.monthlyIncome);

        const monthlyIncome = parseFloat(req.body.monthlyIncome) || 0;
        console.log("[Analyze] Parsed monthlyIncome:", monthlyIncome);

        if (monthlyIncome <= 0) {
            console.log("[Analyze] REJECTED: monthlyIncome <= 0");
            return res
                .status(400)
                .json({ message: "Aylık gelir bilgisi gereklidir." });
        }

        let transactions = [];
        let bankDetected = "Manuel Giriş";
        let rawText = "";
        let pdfInfo = {};

        // PDF varsa parse et
        if (req.file) {
            console.log(`[Analyze] Processing PDF: ${req.file.originalname} (${req.file.size} bytes)`);
            const pdfResult = await extractTransactionsFromPDF(req.file.buffer);
            transactions = pdfResult.transactions;
            bankDetected = pdfResult.bankDetected;
            rawText = pdfResult.rawText || "";
            pdfInfo = {
                fileName: req.file.originalname,
                fileSize: req.file.size,
                rawTextLength: pdfResult.rawTextLength,
                parsingStrategy: pdfResult.bankDetected,
                totalParsed: pdfResult.totalParsed,
            };

            if (pdfResult.error) {
                pdfInfo.error = pdfResult.error;
            }

            console.log(`[Analyze] Parsed ${transactions.length} transactions using strategy: ${bankDetected}`);
        }

        // Manuel işlemler varsa ekle
        if (req.body.manualTransactions) {
            try {
                const manual = JSON.parse(req.body.manualTransactions);
                if (Array.isArray(manual)) {
                    transactions = [...transactions, ...manual];
                }
            } catch (e) {
                // ignore parse errors
            }
        }

        // If no transactions found, still return raw text for debugging
        if (transactions.length === 0) {
            return res.status(200).json({
                success: false,
                message: "PDF'den işlem bulunamadı. Farklı bir ekstre formatı deneyin veya manuel işlem ekleyin.",
                pdfInfo,
                rawTextPreview: rawText.substring(0, 2000),
                analysis: null,
            });
        }

        // Full analysis
        const analysis = await runFullAnalysis(transactions, monthlyIncome);
        analysis.bankDetected = bankDetected;
        analysis.pdfInfo = pdfInfo;

        // Save individual transactions to MongoDB
        try {
            // Remove old PDF-sourced transactions for this user to avoid duplicates
            await Transaction.deleteMany({ user: req.user._id, source: "pdf" });
            const txDocs = analysis.transactions.map(t => ({
                user: req.user._id,
                description: t.description,
                originalDescription: t.originalDescription || t.description,
                amount: t.amount,
                totalAmount: t.totalAmount || null,
                date: new Date(t.date),
                type: "expense",
                category: t.category || "yasam_tarzi",
                currency: t.currency || "TL",
                isInstallment: t.isInstallment || false,
                installmentCurrent: t.installmentCurrent || null,
                installmentTotal: t.installmentTotal || null,
                source: "pdf",
            }));
            if (txDocs.length > 0) await Transaction.insertMany(txDocs);
        } catch (dbErr) {
            console.error("Transaction DB save error (non-critical):", dbErr.message);
        }

        // Save summary to Wallet model
        try {
            const wallet = await Wallet.findOne({ user: req.user._id });
            if (wallet) {
                wallet.monthlyIncome = monthlyIncome;
                wallet.monthlyExpense = analysis.metrics.totalExpense;
                wallet.savings = analysis.metrics.netBalance;

                if (!wallet.analyses) wallet.analyses = [];
                wallet.analyses.push({
                    date: new Date(),
                    monthlyIncome,
                    totalExpense: analysis.metrics.totalExpense,
                    transactionCount: analysis.summary.transactionCount,
                    healthStatus: analysis.summary.healthStatus,
                    burnDay: analysis.metrics.burnRate.burnDay,
                });

                if (wallet.analyses.length > 12) {
                    wallet.analyses = wallet.analyses.slice(-12);
                }

                wallet.calculateHealthScore();
                await wallet.save();
            }
        } catch (dbErr) {
            console.error("DB save error (non-critical):", dbErr.message);
        }

        res.json({
            success: true,
            analysis,
        });
    } catch (error) {
        console.error("Analysis error:", error);
        res.status(500).json({
            message: "Analiz hatası oluştu: " + error.message,
            error: error.message,
        });
    }
};

/**
 * POST /api/wallet/analyze-manual
 * Manuel harcama listesi ile analiz (PDF olmadan)
 */
export const analyzeManual = async (req, res) => {
    try {
        const { monthlyIncome, transactions } = req.body;

        if (!monthlyIncome || monthlyIncome <= 0) {
            return res
                .status(400)
                .json({ message: "Aylık gelir bilgisi gereklidir." });
        }

        if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
            return res
                .status(400)
                .json({ message: "En az bir işlem gerekli." });
        }

        const cleanTransactions = transactions.map((t) => ({
            date: t.date || new Date().toISOString(),
            description: t.description || "Bilinmeyen",
            amount: parseFloat(t.amount) || 0,
            currency: t.currency || "TL",
            type: t.type || "expense",
            category: t.category || "yasam_tarzi",
            isInstallment: t.isInstallment || false,
            installmentCurrent: t.installmentCurrent || null,
            installmentTotal: t.installmentTotal || null,
            totalAmount: t.totalAmount || null,
        }));

        const analysis = await runFullAnalysis(cleanTransactions, monthlyIncome);
        analysis.bankDetected = "Manuel Giriş";

        // Save individual transactions to MongoDB
        try {
            // Remove old manual transactions to avoid duplicates on re-analysis
            await Transaction.deleteMany({ user: req.user._id, source: "manual" });
            const txDocs = analysis.transactions.map(t => ({
                user: req.user._id,
                description: t.description,
                originalDescription: t.originalDescription || t.description,
                amount: t.amount,
                totalAmount: t.totalAmount || null,
                date: new Date(t.date),
                type: t.type || "expense",
                category: t.category || "yasam_tarzi",
                currency: t.currency || "TL",
                isInstallment: t.isInstallment || false,
                installmentCurrent: t.installmentCurrent || null,
                installmentTotal: t.installmentTotal || null,
                source: "manual",
            }));
            if (txDocs.length > 0) await Transaction.insertMany(txDocs);
        } catch (dbErr) {
            console.error("Transaction DB save error (non-critical):", dbErr.message);
        }

        // Save summary to Wallet model
        try {
            const wallet = await Wallet.findOne({ user: req.user._id });
            if (wallet) {
                wallet.monthlyIncome = monthlyIncome;
                wallet.monthlyExpense = analysis.metrics.totalExpense;
                wallet.savings = analysis.metrics.netBalance;
                wallet.calculateHealthScore();
                await wallet.save();
            }
        } catch (dbErr) {
            console.error("DB save error (non-critical):", dbErr.message);
        }

        res.json({
            success: true,
            analysis,
        });
    } catch (error) {
        console.error("Manual analysis error:", error);
        res.status(500).json({
            message: "Analiz hatası oluştu.",
            error: error.message,
        });
    }
};

/**
 * GET /api/wallet/categories
 */
export const getCategories = (req, res) => {
    res.json(CATEGORY_RULES);
};
