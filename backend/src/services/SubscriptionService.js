// PATH: backend/src/services/SubscriptionService.js
/**
 * SubscriptionService - Core Subscription Business Logic
 * 
 * This service orchestrates all subscription operations, bridging the gap
 * between the database models and payment providers.
 * 
 * SOLID Principles:
 * - Single Responsibility: Only handles subscription logic
 * - Open/Closed: New providers can be added without modifying this service
 * - Dependency Inversion: Depends on IPaymentProvider abstraction
 * 
 * @module services/SubscriptionService
 */

import User from "../models/userModel.js";
import Subscription from "../models/Subscription.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import DummyPaymentProvider from "./payment/DummyPaymentProvider.js";

class SubscriptionService {
    /**
     * Payment provider instance
     * @type {IPaymentProvider}
     */
    #paymentProvider;

    /**
     * Plan hierarchy for upgrade/downgrade logic
     */
    static PLAN_HIERARCHY = { FREE: 0, PLUS: 1, PRO: 2 };

    constructor(paymentProvider = DummyPaymentProvider) {
        this.#paymentProvider = paymentProvider;
    }

    /**
     * Set payment provider (for switching providers)
     */
    setPaymentProvider(provider) {
        this.#paymentProvider = provider;
        console.log(`🔄 [SubscriptionService] Provider changed to: ${provider.name}`);
    }

    /**
     * Get current payment provider name
     */
    getProviderName() {
        return this.#paymentProvider.name;
    }

    /**
     * Get all available subscription plans
     */
    async getAvailablePlans() {
        return SubscriptionPlan.getActivePlans();
    }

    /**
     * Get a specific plan by name
     */
    async getPlan(planName) {
        return SubscriptionPlan.getByName(planName);
    }

    /**
     * Get user's current subscription status
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Subscription details
     */
    async getUserSubscription(userId) {
        // Get user
        const user = await User.findById(userId).select("subscriptionTier subscriptionStatus email firstName lastName");
        if (!user) {
            throw new Error("Kullanıcı bulunamadı");
        }

        // Get active subscription from DB
        const subscription = await Subscription.getActiveForUser(userId);

        // Get plan details
        const planName = user.subscriptionTier || "FREE";
        const plan = await this.getPlan(planName);

        return {
            userId: user._id,
            email: user.email,
            currentPlan: planName,
            planDetails: plan,
            subscription: subscription ? {
                id: subscription._id,
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                daysRemaining: subscription.daysRemaining,
                paymentProvider: subscription.paymentProvider
            } : null,
            isActive: subscription?.isActive || planName === "FREE"
        };
    }

    /**
     * Upgrade user to a higher plan
     * 
     * @param {string} userId - User ID
     * @param {string} newPlanName - Target plan name (PLUS or PRO)
     * @param {Object} paymentDetails - Payment information
     * @param {string} [interval="monthly"] - Billing interval
     * @returns {Promise<Object>} Upgrade result
     */
    async upgradePlan(userId, newPlanName, paymentDetails = {}, interval = "monthly") {
        const normalizedPlan = newPlanName.toUpperCase();

        // Validate plan name
        if (!["PLUS", "PRO"].includes(normalizedPlan)) {
            throw new Error("Geçersiz plan: Yalnızca PLUS veya PRO'ya yükseltilebilir");
        }

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("Kullanıcı bulunamadı");
        }

        const currentPlan = user.subscriptionTier || "FREE";

        // Validate upgrade path
        if (SubscriptionService.PLAN_HIERARCHY[normalizedPlan] <= SubscriptionService.PLAN_HIERARCHY[currentPlan]) {
            throw new Error(`${normalizedPlan} planı mevcut planınızdan (${currentPlan}) yüksek değil`);
        }

        // Get new plan from DB
        const plan = await this.getPlan(normalizedPlan);
        if (!plan) {
            throw new Error(`Plan bulunamadı: ${normalizedPlan}`);
        }

        // Check for existing active subscription
        let existingSubscription = await Subscription.getActiveForUser(userId);

        let providerResult;

        if (existingSubscription && existingSubscription.externalSubscriptionId) {
            // Update existing subscription
            providerResult = await this.#paymentProvider.updateSubscription(
                existingSubscription.externalSubscriptionId,
                plan._id.toString(),
                interval === "yearly" ? plan.price.yearly : plan.price.monthly,
                true // prorated
            );
        } else {
            // Create new subscription with payment provider
            providerResult = await this.#paymentProvider.createSubscription({
                userId: userId.toString(),
                planId: plan._id.toString(),
                planName: normalizedPlan,
                amount: interval === "yearly" ? plan.price.yearly : plan.price.monthly,
                currency: plan.price.currency || "TRY",
                interval,
                paymentDetails,
                customerInfo: {
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`,
                    phone: user.phoneNumber
                }
            });
        }

        if (!providerResult.success) {
            throw new Error(providerResult.error || "Ödeme işlemi başarısız");
        }

        // Update or create subscription in DB
        if (existingSubscription) {
            await existingSubscription.changePlan(normalizedPlan, plan._id);
            existingSubscription.externalSubscriptionId = providerResult.subscriptionId;
            existingSubscription.currentPeriodEnd = providerResult.currentPeriodEnd;
            existingSubscription.providerMetadata = providerResult.metadata;
            await existingSubscription.save();
        } else {
            existingSubscription = new Subscription({
                user: userId,
                plan: plan._id,
                planName: normalizedPlan,
                status: "ACTIVE",
                currentPeriodStart: new Date(),
                currentPeriodEnd: providerResult.currentPeriodEnd,
                paymentProvider: this.#paymentProvider.name,
                externalSubscriptionId: providerResult.subscriptionId,
                externalCustomerId: providerResult.customerId,
                providerMetadata: providerResult.metadata
            });
            await existingSubscription.save();
        }

        // Update user's subscription tier
        user.subscriptionTier = normalizedPlan;
        user.subscriptionStatus = "ACTIVE";
        await user.save();

        console.log(`🚀 [SubscriptionService] User ${user.email} upgraded from ${currentPlan} to ${normalizedPlan}`);

        return {
            success: true,
            message: `${normalizedPlan} planına başarıyla yükseltildi`,
            previousPlan: currentPlan,
            newPlan: normalizedPlan,
            subscription: {
                id: existingSubscription._id,
                status: existingSubscription.status,
                currentPeriodEnd: existingSubscription.currentPeriodEnd
            }
        };
    }

    /**
     * Downgrade user to a lower plan
     * 
     * @param {string} userId - User ID
     * @param {string} newPlanName - Target plan name
     * @returns {Promise<Object>} Downgrade result
     */
    async downgradePlan(userId, newPlanName) {
        const normalizedPlan = newPlanName.toUpperCase();

        // Validate plan
        if (!["FREE", "PLUS"].includes(normalizedPlan)) {
            throw new Error("Geçersiz plan: Yalnızca FREE veya PLUS'a düşürülebilir");
        }

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("Kullanıcı bulunamadı");
        }

        const currentPlan = user.subscriptionTier || "FREE";

        // Validate downgrade path
        if (SubscriptionService.PLAN_HIERARCHY[normalizedPlan] >= SubscriptionService.PLAN_HIERARCHY[currentPlan]) {
            throw new Error(`${normalizedPlan} planı mevcut planınızdan (${currentPlan}) düşük değil`);
        }

        // Get new plan from DB
        const plan = await this.getPlan(normalizedPlan);
        if (!plan) {
            throw new Error(`Plan bulunamadı: ${normalizedPlan}`);
        }

        // Get existing subscription
        const subscription = await Subscription.getActiveForUser(userId);

        if (subscription && subscription.externalSubscriptionId) {
            if (normalizedPlan === "FREE") {
                // Cancel at period end
                await this.#paymentProvider.cancelSubscription(
                    subscription.externalSubscriptionId,
                    false // at period end
                );
                subscription.cancelAtPeriodEnd = true;
                subscription.cancelledAt = new Date();
            } else {
                // Update to lower paid plan
                await this.#paymentProvider.updateSubscription(
                    subscription.externalSubscriptionId,
                    plan._id.toString(),
                    plan.price.monthly,
                    true
                );
            }

            // Track plan change
            subscription.planHistory.push({
                fromPlan: currentPlan,
                toPlan: normalizedPlan,
                changedAt: new Date(),
                reason: "downgrade"
            });

            subscription.planName = normalizedPlan;
            subscription.plan = plan._id;
            await subscription.save();
        }

        // Update user - for FREE, apply immediately or at period end based on business rules
        // Here we apply at period end if there's an active subscription
        if (!subscription || normalizedPlan !== "FREE") {
            user.subscriptionTier = normalizedPlan;
            user.subscriptionStatus = normalizedPlan === "FREE" ? "INACTIVE" : "ACTIVE";
            await user.save();
        }

        console.log(`📉 [SubscriptionService] User ${user.email} downgraded from ${currentPlan} to ${normalizedPlan}`);

        return {
            success: true,
            message: normalizedPlan === "FREE"
                ? "Abonelik dönem sonunda iptal edilecek"
                : `${normalizedPlan} planına düşürüldü`,
            previousPlan: currentPlan,
            newPlan: normalizedPlan,
            effectiveAt: subscription?.currentPeriodEnd || new Date()
        };
    }

    /**
     * Cancel subscription
     * 
     * @param {string} userId - User ID
     * @param {boolean} [immediately=false] - Cancel immediately or at period end
     * @param {string} [reason] - Cancellation reason
     */
    async cancelSubscription(userId, immediately = false, reason = null) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("Kullanıcı bulunamadı");
        }

        const subscription = await Subscription.getActiveForUser(userId);
        if (!subscription) {
            throw new Error("Aktif abonelik bulunamadı");
        }

        // Cancel with payment provider
        if (subscription.externalSubscriptionId) {
            await this.#paymentProvider.cancelSubscription(
                subscription.externalSubscriptionId,
                immediately
            );
        }

        if (immediately) {
            await subscription.cancelImmediately(reason);
            user.subscriptionTier = "FREE";
            user.subscriptionStatus = "CANCELLED";
        } else {
            await subscription.cancelAtEnd(reason);
        }

        await user.save();

        console.log(`🛑 [SubscriptionService] User ${user.email} cancelled subscription (immediately: ${immediately})`);

        return {
            success: true,
            message: immediately
                ? "Abonelik hemen iptal edildi"
                : "Abonelik dönem sonunda iptal edilecek",
            cancelledAt: subscription.cancelledAt,
            effectiveAt: immediately ? new Date() : subscription.currentPeriodEnd
        };
    }

    /**
     * Process webhook from payment provider
     * 
     * @param {string} provider - Provider name
     * @param {Object} payload - Webhook payload
     * @param {string} signature - Webhook signature
     */
    async processWebhook(provider, payload, signature) {
        // Validate signature
        const isValid = this.#paymentProvider.validateWebhook(payload, signature);
        if (!isValid) {
            console.error(`⚠️ [SubscriptionService] Invalid webhook signature from ${provider}`);
            throw new Error("Invalid webhook signature");
        }

        // Handle the webhook
        const result = await this.#paymentProvider.handleWebhook(payload);

        // Process based on event type
        switch (result.eventType) {
            case "subscription.cancelled":
                await this.#handleSubscriptionCancelled(result.data);
                break;
            case "invoice.payment_failed":
                await this.#handlePaymentFailed(result.data);
                break;
            case "invoice.paid":
                await this.#handlePaymentSucceeded(result.data);
                break;
            default:
                console.log(`📨 [SubscriptionService] Unhandled webhook event: ${result.eventType}`);
        }

        return { processed: true, eventType: result.eventType };
    }

    /**
     * Handle subscription cancelled webhook
     * @private
     */
    async #handleSubscriptionCancelled(data) {
        const subscription = await Subscription.findOne({
            externalSubscriptionId: data.subscriptionId
        });

        if (subscription) {
            subscription.status = "CANCELLED";
            await subscription.save();

            const user = await User.findById(subscription.user);
            if (user) {
                user.subscriptionTier = "FREE";
                user.subscriptionStatus = "CANCELLED";
                await user.save();
            }
        }
    }

    /**
     * Handle payment failed webhook
     * @private
     */
    async #handlePaymentFailed(data) {
        const subscription = await Subscription.findOne({
            externalSubscriptionId: data.subscriptionId
        });

        if (subscription) {
            subscription.status = "PAST_DUE";
            await subscription.save();

            const user = await User.findById(subscription.user);
            if (user) {
                user.subscriptionStatus = "PAST_DUE";
                await user.save();
            }

            // TODO: Send email notification about payment failure
        }
    }

    /**
     * Handle successful payment webhook
     * @private
     */
    async #handlePaymentSucceeded(data) {
        const subscription = await Subscription.findOne({
            externalSubscriptionId: data.subscriptionId
        });

        if (subscription && subscription.status === "PAST_DUE") {
            subscription.status = "ACTIVE";
            await subscription.save();

            const user = await User.findById(subscription.user);
            if (user) {
                user.subscriptionStatus = "ACTIVE";
                await user.save();
            }
        }
    }

    /**
     * Sync subscription status from payment provider
     * Useful for periodic checks or manual reconciliation
     */
    async syncSubscriptionStatus(userId) {
        const subscription = await Subscription.getActiveForUser(userId);
        if (!subscription?.externalSubscriptionId) {
            return { synced: false, reason: "No external subscription" };
        }

        const providerData = await this.#paymentProvider.getSubscription(
            subscription.externalSubscriptionId
        );

        if (!providerData.success) {
            return { synced: false, reason: providerData.error };
        }

        // Update local status if different
        if (subscription.status !== providerData.status.toUpperCase()) {
            subscription.status = providerData.status.toUpperCase();
            await subscription.save();

            const user = await User.findById(userId);
            if (user) {
                user.subscriptionStatus = providerData.status.toUpperCase();
                await user.save();
            }
        }

        return { synced: true, status: subscription.status };
    }
}

// Export singleton instance
export default new SubscriptionService();

// Also export class for custom instances
export { SubscriptionService };
