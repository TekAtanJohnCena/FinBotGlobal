// PATH: backend/src/middleware/quotaMiddleware.js
// Plan-based Quota Control Middleware (UTC Midnight Reset)

import User from "../models/userModel.js";

/**
 * Plan Quota Limits
 * 
 * Tier Breakdown (Weekly for PLUS/PRO, Daily for FREE):
 * - FREE:  5 queries/day, 1 news analysis, 5 years data (Daily reset)
 * - PLUS: 150 queries/week, 30 news analyses, 10 years data (Weekly reset)
 * - PRO: 250 queries/week, 100 news analyses, unlimited data (Weekly reset)
 */
const QUOTA_LIMITS = {
    FREE: { finbotQueries: 5, newsAnalysis: 1, dataYears: 5, resetPeriod: "DAILY" },
    PLUS: { finbotQueries: 150, newsAnalysis: 30, dataYears: 10, resetPeriod: "WEEKLY" },
    PRO: { finbotQueries: 250, newsAnalysis: 100, dataYears: 999, resetPeriod: "WEEKLY" }
};

/**
 * Backward compatibility: Map old tier names to new names
 */
const TIER_ALIASES = {
    BASIC: "PLUS",
    PREMIUM: "PRO",
    "BASİC": "PLUS",
    "PREMİUM": "PRO"
};

/**
 * Normalize tier name
 */
const normalizeTier = (tier) => {
    if (!tier) return "FREE";
    const upperTier = tier.toUpperCase();
    return TIER_ALIASES[upperTier] || upperTier;
};

/**
 * Check if quota needs reset
 * DAILY for FREE, WEEKLY (Monday 00:00 UTC) for PLUS/PRO
 */
const shouldResetQuota = (lastResetDate, tier) => {
    if (!lastResetDate) return true;

    const now = new Date();
    const lastReset = new Date(lastResetDate);
    const normalizedTier = normalizeTier(tier);

    if (normalizedTier === "FREE") {
        // Daily reset for FREE
        const nowUTC = now.toISOString().split('T')[0];
        const lastResetUTC = lastReset.toISOString().split('T')[0];
        return nowUTC !== lastResetUTC;
    } else {
        // Weekly reset for PLUS/PRO (Every Monday 00:00 UTC)
        const getMonday = (d) => {
            const date = new Date(d);
            const day = date.getUTCDay();
            const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
            date.setUTCDate(diff);
            date.setUTCHours(0, 0, 0, 0);
            return date;
        };
        const lastMonday = getMonday(now);
        return lastReset < lastMonday;
    }
};

/**
 * Reset user's quota
 */
const resetUserQuota = async (user) => {
    user.usage = {
        finbotQueries: 0,
        newsAnalysis: 0,
        lastResetDate: new Date()
    };
    await user.save();
};

/**
 * Get quota limits for user's plan
 */
export const getQuotaLimits = (tier) => {
    const normalizedTier = normalizeTier(tier);
    return QUOTA_LIMITS[normalizedTier] || QUOTA_LIMITS.FREE;
};

/**
 * Get next reset timestamp
 */
const getNextResetTime = (tier) => {
    const now = new Date();
    const normalizedTier = normalizeTier(tier);

    if (normalizedTier === "FREE") {
        // Next midnight
        const tomorrow = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() + 1,
            0, 0, 0, 0
        ));
        return tomorrow.toISOString();
    } else {
        // Next Monday 00:00 UTC
        const date = new Date(now);
        const day = date.getUTCDay();
        const daysToMonday = day === 0 ? 1 : 8 - day;
        date.setUTCDate(date.getUTCDate() + daysToMonday);
        date.setUTCHours(0, 0, 0, 0);
        return date.toISOString();
    }
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

        const tier = normalizeTier(user.subscriptionTier);

        // Check if quota needs reset
        if (shouldResetQuota(user.usage?.lastResetDate, tier)) {
            await resetUserQuota(user);
        }

        const limits = getQuotaLimits(tier);
        const currentUsage = user.usage?.finbotQueries || 0;

        if (currentUsage >= limits.finbotQueries) {
            let quotaMsg = `Haftalık Finbot sorgu limitiniz (${limits.finbotQueries}) doldu`;
            if (tier === "FREE" || tier === "PLUS") {
                quotaMsg = "Haklarınız tükendi ama sorun değil, Pro'ya yükselterek devam edebilirsiniz.";
            } else if (tier === "PRO") {
                quotaMsg = "Yanıt hakkın tükendi biraz ara ver finbot yoruldu.";
            }

            return res.status(429).json({
                ok: false,
                error: "quota_exceeded",
                message: quotaMsg,
                data: {
                    type: "finbotQueries",
                    used: currentUsage,
                    limit: limits.finbotQueries,
                    remaining: 0,
                    plan: tier,
                    resetsAt: getNextResetTime(tier),
                    upgradeRequired: tier === "FREE" ? "PLUS" : tier === "PLUS" ? "PRO" : null
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

        const tier = normalizeTier(user.subscriptionTier);

        // Check if quota needs reset
        if (shouldResetQuota(user.usage?.lastResetDate, tier)) {
            await resetUserQuota(user);
        }

        const limits = getQuotaLimits(tier);
        const currentUsage = user.usage?.newsAnalysis || 0;

        if (currentUsage >= limits.newsAnalysis) {
            let quotaMsg = `Haftalık haber analizi limitiniz (${limits.newsAnalysis}) doldu`;
            if (tier === "FREE" || tier === "PLUS") {
                quotaMsg = "Haklarınız tükendi ama sorun değil, Pro'ya yükselterek devam edebilirsiniz.";
            } else if (tier === "PRO") {
                quotaMsg = "Yanıt hakkın tükendi biraz ara ver finbot yoruldu.";
            }

            return res.status(429).json({
                ok: false,
                error: "quota_exceeded",
                message: quotaMsg,
                data: {
                    type: "newsAnalysis",
                    used: currentUsage,
                    limit: limits.newsAnalysis,
                    remaining: 0,
                    plan: tier,
                    resetsAt: getNextResetTime(tier),
                    upgradeRequired: tier === "FREE" ? "PLUS" : tier === "PLUS" ? "PRO" : null
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
    const tier = normalizeTier(user.subscriptionTier);
    const limits = getQuotaLimits(tier);

    // Check if quota needs reset
    if (shouldResetQuota(user.usage?.lastResetDate, tier)) {
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
        resetPeriod: limits.resetPeriod,
        resetsAt: getNextResetTime(tier)
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
