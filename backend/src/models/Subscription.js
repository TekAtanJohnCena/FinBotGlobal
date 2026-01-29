// PATH: backend/src/models/Subscription.js
/**
 * Subscription Model
 * Tracks user subscriptions with payment provider integration
 * 
 * Designed to be payment-provider agnostic - stores external IDs and metadata
 * that can work with any payment gateway (Param, NKolay, Stripe, etc.)
 * 
 * @module models/Subscription
 */

import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
    {
        // User Reference
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        // Plan Reference
        plan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SubscriptionPlan",
            required: true
        },

        // Denormalized plan name for quick access (avoids joins)
        planName: {
            type: String,
            enum: ["FREE", "PLUS", "PRO"],
            required: true
        },

        // Subscription Status
        status: {
            type: String,
            enum: [
                "ACTIVE",      // Currently active and paid
                "TRIALING",    // In trial period
                "PAST_DUE",    // Payment failed, grace period
                "CANCELLED",   // User cancelled (still active until period end)
                "EXPIRED",     // Subscription ended
                "PAUSED"       // Temporarily paused
            ],
            default: "ACTIVE"
        },

        // Billing Period
        currentPeriodStart: {
            type: Date,
            default: Date.now
        },
        currentPeriodEnd: {
            type: Date,
            required: true
        },

        // Cancellation
        cancelAtPeriodEnd: {
            type: Boolean,
            default: false
        },
        cancelledAt: {
            type: Date
        },
        cancellationReason: {
            type: String
        },

        // Payment Provider Integration (Provider-Agnostic)
        paymentProvider: {
            type: String,
            enum: ["dummy", "param", "nkolay", "stripe", "iyzico", "manual"],
            default: "dummy"
        },
        externalSubscriptionId: {
            type: String,
            sparse: true,
            index: true
        },
        externalCustomerId: {
            type: String
        },

        // Provider-specific metadata (flexible JSON storage)
        providerMetadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        // Upgrade/Downgrade History
        planHistory: [{
            fromPlan: String,
            toPlan: String,
            changedAt: { type: Date, default: Date.now },
            reason: String
        }],

        // Trial Information
        trialStart: Date,
        trialEnd: Date,

        // Payment Method (last 4 digits, type, etc. - no sensitive data)
        paymentMethod: {
            type: { type: String },   // "card", "bank_transfer", etc.
            last4: String,
            brand: String,            // "visa", "mastercard", etc.
            expiryMonth: Number,
            expiryYear: Number
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Compound indexes for efficient queries
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ externalSubscriptionId: 1, paymentProvider: 1 });

// Virtual: Is subscription currently active?
subscriptionSchema.virtual("isActive").get(function () {
    return ["ACTIVE", "TRIALING"].includes(this.status) &&
        this.currentPeriodEnd > new Date();
});

// Virtual: Days remaining in current period
subscriptionSchema.virtual("daysRemaining").get(function () {
    if (!this.currentPeriodEnd) return 0;
    const now = new Date();
    const diff = this.currentPeriodEnd - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

/**
 * Instance method: Cancel subscription at period end
 */
subscriptionSchema.methods.cancelAtEnd = async function (reason = null) {
    this.cancelAtPeriodEnd = true;
    this.cancelledAt = new Date();
    if (reason) this.cancellationReason = reason;
    return this.save();
};

/**
 * Instance method: Immediately cancel subscription
 */
subscriptionSchema.methods.cancelImmediately = async function (reason = null) {
    this.status = "CANCELLED";
    this.cancelledAt = new Date();
    if (reason) this.cancellationReason = reason;
    return this.save();
};

/**
 * Instance method: Change plan (upgrade/downgrade)
 */
subscriptionSchema.methods.changePlan = async function (newPlan, newPlanId) {
    this.planHistory.push({
        fromPlan: this.planName,
        toPlan: newPlan,
        changedAt: new Date(),
        reason: this.planName < newPlan ? "upgrade" : "downgrade"
    });

    this.planName = newPlan;
    this.plan = newPlanId;
    return this.save();
};

/**
 * Static: Get active subscription for user
 */
subscriptionSchema.statics.getActiveForUser = async function (userId) {
    return this.findOne({
        user: userId,
        status: { $in: ["ACTIVE", "TRIALING"] },
        currentPeriodEnd: { $gt: new Date() }
    }).populate("plan");
};

/**
 * Static: Get subscription history for user
 */
subscriptionSchema.statics.getHistoryForUser = async function (userId) {
    return this.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate("plan");
};

export default mongoose.model("Subscription", subscriptionSchema);
