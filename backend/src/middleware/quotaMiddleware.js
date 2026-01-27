// PATH: backend/src/middleware/quotaMiddleware.js
// Plan-based Quota Control Middleware (UTC Midnight Reset)

import User from "../models/userModel.js";

/**
 * Plan Quota Limits
 * FREE = Free, BASIC = Plus, PREMIUM = Pro
 */
const QUOTA_LIMITS = {
    FREE: { finbotQueries: 5, newsAnalysis: 1, dataYears: 5 },
    BASIC: { finbotQueries: 50, newsAnalysis: 10, dataYears: 10 },
    PREMIUM: { finbotQueries: 250, newsAnalysis: 50, dataYears: 25 }
};

/**
 * Check if daily quota needs reset (UTC midnight)
 */
const shouldResetQuota = (lastResetDate) => {
    if (!lastResetDate) return true;

    const now = new Date();
    const lastReset = new Date(lastResetDate);

    // Get UTC date strings to compare
    const nowUTC = now.toISOString().split('T')[0];
    const lastResetUTC = lastReset.toISOString().split('T')[0];

    return nowUTC !== lastResetUTC;
};

/**
 * Reset user's daily quota
 */
const resetUserQuota = async (user) => {
    user.usage = {
        finbotQueries: 0,
        newsAnalysis: 0,
        lastResetDate: new Date()
    };
    await user.save();
    console.log(`🔄 Quota reset for user: ${user.email}`);
};

/**
 * Get quota limits for user's plan
 */
export const getQuotaLimits = (tier) => {
    return QUOTA_LIMITS[tier] || QUOTA_LIMITS.FREE;
};

/**
 * Get next UTC midnight timestamp
 */
const getNextResetTime = () => {
    const now = new Date();
    const tomorrow = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0, 0
    ));
    return tomorrow.toISOString();
};

/**
 * Middleware: Check Finbot Query Quota
 */
export const checkFinbotQuota = async (req, res, next) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: "Kimlik doğrulama gerekli" });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "Kullanıcı bulunamadı" });
        }

        // Check if quota needs reset
        if (shouldResetQuota(user.usage?.lastResetDate)) {
            await resetUserQuota(user);
        }

        const tier = user.subscriptionTier || "FREE";
        const limits = getQuotaLimits(tier);
        const currentUsage = user.usage?.finbotQueries || 0;

        if (currentUsage >= limits.finbotQueries) {
            return res.status(429).json({
                ok: false,
                error: "quota_exceeded",
                message: "Günlük Finbot sorgu limitiniz doldu",
                data: {
                    type: "finbotQueries",
                    used: currentUsage,
                    limit: limits.finbotQueries,
                    remaining: 0,
                    plan: tier,
                    resetsAt: getNextResetTime(),
                    upgradeRequired: tier === "FREE" ? "BASIC" : tier === "BASIC" ? "PREMIUM" : null
                }
            });
        }

        // Attach quota info to request for later use
        req.quotaInfo = {
            tier,
            limits,
            currentUsage,
            remaining: limits.finbotQueries - currentUsage - 1
        };

        next();
    } catch (error) {
        console.error("Quota check error:", error);
        res.status(500).json({ message: "Kota kontrolü sırasında hata oluştu" });
    }
};

/**
 * Middleware: Increment Finbot Usage (call after successful response)
 */
export const incrementFinbotUsage = async (userId) => {
    try {
        await User.findByIdAndUpdate(userId, {
            $inc: { "usage.finbotQueries": 1 }
        });
    } catch (error) {
        console.error("Failed to increment finbot usage:", error);
    }
};

/**
 * Middleware: Check News Analysis Quota
 */
export const checkNewsQuota = async (req, res, next) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: "Kimlik doğrulama gerekli" });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "Kullanıcı bulunamadı" });
        }

        // Check if quota needs reset
        if (shouldResetQuota(user.usage?.lastResetDate)) {
            await resetUserQuota(user);
        }

        const tier = user.subscriptionTier || "FREE";
        const limits = getQuotaLimits(tier);
        const currentUsage = user.usage?.newsAnalysis || 0;

        if (currentUsage >= limits.newsAnalysis) {
            return res.status(429).json({
                ok: false,
                error: "quota_exceeded",
                message: "Günlük haber analizi limitiniz doldu",
                data: {
                    type: "newsAnalysis",
                    used: currentUsage,
                    limit: limits.newsAnalysis,
                    remaining: 0,
                    plan: tier,
                    resetsAt: getNextResetTime(),
                    upgradeRequired: tier === "FREE" ? "BASIC" : tier === "BASIC" ? "PREMIUM" : null
                }
            });
        }

        req.quotaInfo = {
            tier,
            limits,
            currentUsage,
            remaining: limits.newsAnalysis - currentUsage - 1
        };

        next();
    } catch (error) {
        console.error("Quota check error:", error);
        res.status(500).json({ message: "Kota kontrolü sırasında hata oluştu" });
    }
};

/**
 * Middleware: Increment News Analysis Usage
 */
export const incrementNewsUsage = async (userId) => {
    try {
        await User.findByIdAndUpdate(userId, {
            $inc: { "usage.newsAnalysis": 1 }
        });
    } catch (error) {
        console.error("Failed to increment news usage:", error);
    }
};

/**
 * Get user's current quota status
 */
export const getUserQuotaStatus = async (user) => {
    const tier = user.subscriptionTier || "FREE";
    const limits = getQuotaLimits(tier);

    // Check if quota needs reset
    if (shouldResetQuota(user.usage?.lastResetDate)) {
        await resetUserQuota(user);
        user = await User.findById(user._id);
    }

    const finbotUsed = user.usage?.finbotQueries || 0;
    const newsUsed = user.usage?.newsAnalysis || 0;

    return {
        plan: tier,
        finbotQueries: {
            used: finbotUsed,
            limit: limits.finbotQueries,
            remaining: Math.max(0, limits.finbotQueries - finbotUsed)
        },
        newsAnalysis: {
            used: newsUsed,
            limit: limits.newsAnalysis,
            remaining: Math.max(0, limits.newsAnalysis - newsUsed)
        },
        dataYears: limits.dataYears,
        resetsAt: getNextResetTime()
    };
};

export default {
    checkFinbotQuota,
    checkNewsQuota,
    incrementFinbotUsage,
    incrementNewsUsage,
    getUserQuotaStatus,
    getQuotaLimits,
    QUOTA_LIMITS
};
