// PATH: backend/src/models/FinanceReport.js
/**
 * Finance Report Model
 * Stores PDF analysis results for each user, enabling persistent monthly tracking
 */

import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
    date: { type: String },
    description: { type: String },
    amount: { type: Number },
    type: { type: String, enum: ["income", "expense"] },
    category: { type: String },
}, { _id: false });

const FinanceReportSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    // Source info
    bankName: { type: String, default: "Bilinmiyor" },
    period: { type: String, default: "Bilinmiyor" },
    currency: { type: String, default: "TRY" },
    fileName: { type: String, default: "" },

    // Parsed data
    transactions: [TransactionSchema],

    // Server-calculated summary (not from AI)
    summary: {
        totalIncome: { type: Number, default: 0 },
        totalExpense: { type: Number, default: 0 },
        netBalance: { type: Number, default: 0 },
        transactionCount: { type: Number, default: 0 },
    },

    // Server-calculated metrics
    metrics: {
        income: { type: Number, default: 0 },
        expense: { type: Number, default: 0 },
        savingsAmount: { type: Number, default: 0 },
        savingsRate: { type: Number, default: 0 },
        expenseRatio: { type: Number, default: 0 },
        expenseClass: {
            level: String,
            emoji: String,
            detail: String,
        },
        savingsClass: {
            level: String,
            emoji: String,
        },
        fixedExpense: { type: Number, default: 0 },
        variableExpense: { type: Number, default: 0 },
        fixedExpenseRatio: { type: Number, default: 0 },
        categories: [{ category: String, total: Number, percentage: Number, isDominant: Boolean }],
        rule502030: {
            needs: { target: Number, actual: Number, status: String },
            wants: { target: Number, actual: Number, status: String },
            savings: { target: Number, actual: Number, status: String },
        },
    },

    // AI-generated recommendations (markdown text)
    recommendations: { type: String, default: "" },

    // User-provided monthly income at time of upload
    monthlyIncomeInput: { type: Number, default: 0 },
}, {
    timestamps: true,
});

// Index for efficient queries: user + newest first
FinanceReportSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("FinanceReport", FinanceReportSchema);
