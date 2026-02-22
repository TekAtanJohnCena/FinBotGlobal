import mongoose from "mongoose";

const paymentTransactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        merchantPaymentId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        amount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: "TRY"
        },
        status: {
            type: String,
            enum: ["PENDING", "SUCCESS", "FAILED"],
            default: "PENDING"
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        sessionToken: {
            type: String
        },
        planType: {
            type: String,
            enum: ["BASIC", "PLUS", "PRO"],
            required: true
        },
        billingPeriod: {
            type: String,
            enum: ["MONTHLY", "YEARLY"],
            default: "MONTHLY"
        },
        customerInfo: {
            name: String,
            email: String
        },
        paymentProvider: {
            type: String,
            default: "Paratika"
        },
        rawResponse: {
            type: mongoose.Schema.Types.Mixed
        },
        errorMsg: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("PaymentTransaction", paymentTransactionSchema);
