// PATH: backend/src/routes/subscriptionRoutes.js
/**
 * Subscription Routes
 * 
 * Handles all subscription-related API endpoints:
 * - List available plans
 * - Get current subscription status
 * - Upgrade/downgrade plans
 * - Cancel subscription
 * - Process payment webhooks
 * 
 * @module routes/subscriptionRoutes
 */

import express from "express";
import { protect } from "../middleware/auth.js";
import SubscriptionService from "../services/SubscriptionService.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import { getUserQuotaStatus } from "../middleware/quotaMiddleware.js";
import User from "../models/userModel.js";

const router = express.Router();

/**
 * GET /api/subscription/plans
 * Get all available subscription plans (public)
 */
router.get("/plans", async (req, res) => {
    try {
        const plans = await SubscriptionPlan.getActivePlans();

        // Format for frontend
        const formattedPlans = plans.map(plan => ({
            id: plan._id,
            name: plan.name,
            displayName: plan.displayName,
            displayNameTR: plan.displayNameTR,
            price: plan.price,
            limits: plan.limits,
            features: plan.features,
            sortOrder: plan.sortOrder
        }));

        res.json({ ok: true, data: formattedPlans });
    } catch (error) {
        console.error("Error fetching plans:", error);
        res.status(500).json({ ok: false, error: "Planlar alınırken hata oluştu" });
    }
});

/**
 * GET /api/subscription/status
 * Get current user's subscription status (protected)
 */
router.get("/status", protect, async (req, res) => {
    try {
        const subscription = await SubscriptionService.getUserSubscription(req.user._id);

        // Get quota status
        const user = await User.findById(req.user._id);
        const quotaStatus = await getUserQuotaStatus(user);

        res.json({
            ok: true,
            data: {
                ...subscription,
                quota: quotaStatus
            }
        });
    } catch (error) {
        console.error("Error fetching subscription status:", error);
        res.status(500).json({ ok: false, error: error.message || "Abonelik durumu alınırken hata oluştu" });
    }
});

/**
 * POST /api/subscription/upgrade
 * Upgrade to a higher plan (protected)
 * 
 * Body: { planName: "PLUS" | "PRO", interval?: "monthly" | "yearly" }
 */
router.post("/upgrade", protect, async (req, res) => {
    try {
        const { planName, interval = "monthly", paymentDetails = {} } = req.body;

        if (!planName) {
            return res.status(400).json({ ok: false, error: "Plan adı gerekli" });
        }

        const result = await SubscriptionService.upgradePlan(
            req.user._id,
            planName,
            paymentDetails,
            interval
        );

        res.json({ ok: true, data: result });
    } catch (error) {
        console.error("Upgrade error:", error);
        res.status(400).json({ ok: false, error: error.message || "Yükseltme başarısız" });
    }
});

/**
 * POST /api/subscription/downgrade
 * Downgrade to a lower plan (protected)
 * 
 * Body: { planName: "FREE" | "PLUS" }
 */
router.post("/downgrade", protect, async (req, res) => {
    try {
        const { planName } = req.body;

        if (!planName) {
            return res.status(400).json({ ok: false, error: "Plan adı gerekli" });
        }

        const result = await SubscriptionService.downgradePlan(req.user._id, planName);

        res.json({ ok: true, data: result });
    } catch (error) {
        console.error("Downgrade error:", error);
        res.status(400).json({ ok: false, error: error.message || "Düşürme başarısız" });
    }
});

/**
 * POST /api/subscription/cancel
 * Cancel current subscription (protected)
 * 
 * Body: { immediately?: boolean, reason?: string }
 */
router.post("/cancel", protect, async (req, res) => {
    try {
        const { immediately = false, reason } = req.body;

        const result = await SubscriptionService.cancelSubscription(
            req.user._id,
            immediately,
            reason
        );

        res.json({ ok: true, data: result });
    } catch (error) {
        console.error("Cancel error:", error);
        res.status(400).json({ ok: false, error: error.message || "İptal başarısız" });
    }
});

/**
 * POST /api/subscription/webhook/:provider
 * Handle payment provider webhooks
 * 
 * Note: No auth required - validated via webhook signature
 */
router.post("/webhook/:provider", express.raw({ type: "application/json" }), async (req, res) => {
    try {
        const { provider } = req.params;
        const signature = req.headers["x-webhook-signature"] ||
            req.headers["stripe-signature"] ||
            req.headers["x-signature"] ||
            "";

        // Parse body if needed
        const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

        const result = await SubscriptionService.processWebhook(provider, payload, signature);

        console.log(`📨 Webhook processed: ${provider} - ${result.eventType}`);
        res.json({ ok: true, received: true });
    } catch (error) {
        console.error("Webhook error:", error);
        // Return 200 to prevent retries for invalid webhooks
        res.status(200).json({ ok: false, error: error.message });
    }
});

/**
 * POST /api/subscription/sync
 * Sync subscription status with payment provider (protected)
 */
router.post("/sync", protect, async (req, res) => {
    try {
        const result = await SubscriptionService.syncSubscriptionStatus(req.user._id);
        res.json({ ok: true, data: result });
    } catch (error) {
        console.error("Sync error:", error);
        res.status(500).json({ ok: false, error: error.message });
    }
});

/**
 * GET /api/subscription/quota
 * Get current quota usage (protected)
 */
router.get("/quota", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ ok: false, error: "Kullanıcı bulunamadı" });
        }

        const quotaStatus = await getUserQuotaStatus(user);
        res.json({ ok: true, data: quotaStatus });
    } catch (error) {
        console.error("Quota fetch error:", error);
        res.status(500).json({ ok: false, error: "Kota bilgisi alınırken hata oluştu" });
    }
});

export default router;
