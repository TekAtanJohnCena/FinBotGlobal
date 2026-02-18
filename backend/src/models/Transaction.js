// PATH: backend/src/models/Transaction.js
// Individual financial transaction model with installment support
import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        // Core fields
        description: { type: String, required: true, trim: true, maxlength: 200 },
        originalDescription: { type: String, trim: true }, // raw text from PDF
        date: { type: Date, required: true, default: Date.now },
        type: {
            type: String,
            enum: ["income", "expense"],
            default: "expense",
        },
        category: {
            type: String,
            enum: ["sabit_gider", "yasam_tarzi", "finansal_odeme", "yatirim_firsati", "gelir", "diger"],
            default: "yasam_tarzi",
        },
        currency: { type: String, default: "TL" },

        // Amount fields
        // `amount` = the monthly/effective amount (installment portion or full amount)
        amount: { type: Number, required: true, min: 0 },
        // `totalAmount` = the full purchase price (only set for installments)
        totalAmount: { type: Number, default: null },

        // Installment tracking
        isInstallment: { type: Boolean, default: false },
        installmentCurrent: { type: Number, default: null }, // e.g. 3 (current installment number)
        installmentTotal: { type: Number, default: null },   // e.g. 6 (total installments)

        // Recurring transaction support
        isRecurring: { type: Boolean, default: false },
        recurringGroupId: { type: String, default: null }, // UUID linking recurring installments

        // Source
        source: {
            type: String,
            enum: ["manual", "pdf", "demo"],
            default: "manual",
        },
    },
    { timestamps: true }
);

// Compound index for efficient user queries
TransactionSchema.index({ user: 1, date: -1 });
TransactionSchema.index({ user: 1, recurringGroupId: 1 });

export default mongoose.model("Transaction", TransactionSchema);
