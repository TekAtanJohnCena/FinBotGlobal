// PATH: backend/src/models/SubscriptionPlan.js
/**
 * SubscriptionPlan Model
 * Defines the three subscription tiers (FREE, PLUS, PRO) with their limits and features
 * 
 * @module models/SubscriptionPlan
 */

import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema(
    {
        // Plan Identification
        name: {
            type: String,
            required: true,
            unique: true,
            enum: ["FREE", "PLUS", "PRO"],
            uppercase: true
        },
        displayName: {
            type: String,
            required: true
        },
        displayNameTR: {
            type: String
            // Will be set explicitly in seed data
        },

        // Pricing (in TRY)
        price: {
            monthly: { type: Number, default: 0 },
            yearly: { type: Number, default: 0 },
            currency: { type: String, default: "TRY" }
        },

        // Usage Limits (Resets daily at UTC 00:00)
        limits: {
            // Feature 1: Chat/Query Limits (Daily)
            dailyQueries: {
                type: Number,
                required: true,
                default: 5
            },
            // Feature 2: News Analysis (Daily)
            dailyNewsAnalysis: {
                type: Number,
                required: true,
                default: 1
            },
            // Feature 3: Market Data History (Tiingo API) - Years lookback
            dataHistoryYears: {
                type: Number,
                required: true,
                default: 5
            }
        },

        // Features List (for display purposes)
        features: [{
            type: String
        }],

        // Plan Order (for sorting: FREE=0, PLUS=1, PRO=2)
        sortOrder: {
            type: Number,
            default: 0
        },

        // Is this plan available for new subscriptions?
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

// Indexes for efficient queries
// Note: `name` already indexed via unique:true
subscriptionPlanSchema.index({ isActive: 1, sortOrder: 1 });

/**
 * Static method to get plan by name
 */
subscriptionPlanSchema.statics.getByName = async function (name) {
    return this.findOne({ name: name.toUpperCase(), isActive: true });
};

/**
 * Static method to get all active plans sorted by tier
 */
subscriptionPlanSchema.statics.getActivePlans = async function () {
    return this.find({ isActive: true }).sort({ sortOrder: 1 });
};

/**
 * Static method to get limits for a specific plan
 */
subscriptionPlanSchema.statics.getLimits = async function (planName) {
    const plan = await this.findOne({ name: planName.toUpperCase() });
    if (!plan) {
        // Default to FREE limits if plan not found
        return { dailyQueries: 5, dailyNewsAnalysis: 1, dataHistoryYears: 5 };
    }
    return plan.limits;
};

export default mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
