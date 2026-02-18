// PATH: backend/src/controllers/transactionController.js
// CRUD controller for individual transactions
import Transaction from "../models/Transaction.js";
import { runFullAnalysis } from "../services/financeAnalysisService.js";
import { v4 as uuidv4 } from "uuid";

/**
 * GET /api/transactions
 * Returns all transactions for the authenticated user, sorted by date desc
 */
export const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user._id })
            .sort({ date: -1 })
            .lean();
        res.json({ success: true, transactions });
    } catch (err) {
        console.error("[Transactions] getTransactions error:", err.message);
        res.status(500).json({ message: "İşlemler alınamadı.", error: err.message });
    }
};

/**
 * POST /api/transactions
 * Add a single transaction (manual entry).
 * If isInstallment=true and installmentTotal>1, creates recurring future entries.
 */
export const addTransaction = async (req, res) => {
    try {
        const {
            description,
            amount,
            date,
            type = "expense",
            category = "yasam_tarzi",
            currency = "TL",
            isInstallment = false,
            installmentTotal = 1,
            installmentCurrent = 1,
            source = "manual",
        } = req.body;

        // Validation
        if (!description || !description.trim()) {
            return res.status(400).json({ message: "Açıklama zorunludur." });
        }
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ message: "Geçerli bir tutar giriniz." });
        }
        const parsedTotal = parseInt(installmentTotal) || 1;
        const parsedCurrent = parseInt(installmentCurrent) || 1;

        // Monthly amount: if user enters total amount for installment, divide it
        const monthlyAmount = isInstallment && parsedTotal > 1
            ? Math.round((parsedAmount / parsedTotal) * 100) / 100
            : parsedAmount;

        const txDate = date ? new Date(date) : new Date();
        if (isNaN(txDate.getTime())) {
            return res.status(400).json({ message: "Geçersiz tarih formatı." });
        }

        const toCreate = [];

        if (isInstallment && parsedTotal > 1) {
            // Create a recurring group for all installments
            const groupId = uuidv4();
            for (let i = parsedCurrent; i <= parsedTotal; i++) {
                // Each installment is one month apart from the base date
                const installDate = new Date(txDate);
                installDate.setMonth(installDate.getMonth() + (i - parsedCurrent));
                // Clamp day to month's actual days
                const lastDay = new Date(installDate.getFullYear(), installDate.getMonth() + 1, 0).getDate();
                if (installDate.getDate() > lastDay) installDate.setDate(lastDay);

                toCreate.push({
                    user: req.user._id,
                    description: description.trim(),
                    amount: monthlyAmount,
                    totalAmount: parsedAmount,
                    date: installDate,
                    type,
                    category,
                    currency,
                    isInstallment: true,
                    installmentCurrent: i,
                    installmentTotal: parsedTotal,
                    isRecurring: true,
                    recurringGroupId: groupId,
                    source,
                });
            }
        } else {
            toCreate.push({
                user: req.user._id,
                description: description.trim(),
                amount: monthlyAmount,
                date: txDate,
                type,
                category,
                currency,
                isInstallment: false,
                source,
            });
        }

        const created = await Transaction.insertMany(toCreate);

        res.status(201).json({
            success: true,
            message: isInstallment && parsedTotal > 1
                ? `${toCreate.length} taksit kaydı oluşturuldu.`
                : "İşlem eklendi.",
            transactions: created,
        });
    } catch (err) {
        console.error("[Transactions] addTransaction error:", err.message);
        res.status(500).json({ message: "İşlem eklenemedi.", error: err.message });
    }
};

/**
 * DELETE /api/transactions/:id
 * Delete a single transaction (and optionally its recurring group)
 */
export const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { deleteGroup = false } = req.query;

        const tx = await Transaction.findOne({ _id: id, user: req.user._id });
        if (!tx) {
            return res.status(404).json({ message: "İşlem bulunamadı." });
        }

        if (deleteGroup && tx.recurringGroupId) {
            // Delete all transactions in the recurring group
            const result = await Transaction.deleteMany({
                user: req.user._id,
                recurringGroupId: tx.recurringGroupId,
            });
            return res.json({ success: true, message: `${result.deletedCount} taksit silindi.` });
        }

        await tx.deleteOne();
        res.json({ success: true, message: "İşlem silindi." });
    } catch (err) {
        console.error("[Transactions] deleteTransaction error:", err.message);
        res.status(500).json({ message: "İşlem silinemedi.", error: err.message });
    }
};

/**
 * DELETE /api/transactions
 * Clear ALL transactions for the user
 */
export const clearTransactions = async (req, res) => {
    try {
        const result = await Transaction.deleteMany({ user: req.user._id });
        res.json({ success: true, message: `${result.deletedCount} işlem silindi.` });
    } catch (err) {
        console.error("[Transactions] clearTransactions error:", err.message);
        res.status(500).json({ message: "İşlemler temizlenemedi.", error: err.message });
    }
};
