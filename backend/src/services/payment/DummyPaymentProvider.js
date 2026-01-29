// PATH: backend/src/services/payment/DummyPaymentProvider.js
/**
 * DummyPaymentProvider - Test/Development Payment Provider
 * 
 * This provider simulates payment operations without making real transactions.
 * Use this for testing upgrade/downgrade flows, webhook handling, and subscription
 * lifecycle management.
 * 
 * In production, replace with a real provider (ParamProvider, NKolayProvider, etc.)
 * 
 * @implements {IPaymentProvider}
 * @module services/payment/DummyPaymentProvider
 */

import IPaymentProvider from "../../interfaces/IPaymentProvider.js";
import crypto from "crypto";

class DummyPaymentProvider extends IPaymentProvider {
    name = "dummy";

    // In-memory storage for test subscriptions
    #subscriptions = new Map();
    #customers = new Map();

    // Webhook secret for signature validation (in real provider, this would be from env)
    #webhookSecret = "dummy_webhook_secret_12345";

    /**
     * Generate a dummy external ID
     * @private
     */
    #generateId(prefix) {
        return `${prefix}_${crypto.randomBytes(12).toString("hex")}`;
    }

    /**
     * Calculate period end date based on billing interval
     * @private
     */
    #calculatePeriodEnd(interval) {
        const now = new Date();
        if (interval === "yearly") {
            return new Date(now.setFullYear(now.getFullYear() + 1));
        }
        // Default: monthly
        return new Date(now.setMonth(now.getMonth() + 1));
    }

    /**
     * Create a new subscription (simulated)
     */
    async createSubscription(params) {
        const {
            userId,
            planId,
            planName,
            amount,
            currency = "TRY",
            interval = "monthly",
            paymentDetails,
            customerInfo
        } = params;

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // Generate IDs
        const subscriptionId = this.#generateId("sub");
        const customerId = this.#customers.get(userId) || this.#generateId("cus");

        // Store customer
        this.#customers.set(userId, customerId);

        // Create subscription record
        const subscription = {
            id: subscriptionId,
            customerId,
            userId,
            planId,
            planName,
            amount,
            currency,
            interval,
            status: "active",
            currentPeriodStart: new Date(),
            currentPeriodEnd: this.#calculatePeriodEnd(interval),
            createdAt: new Date(),
            cancelAtPeriodEnd: false,
            metadata: {
                provider: "dummy",
                testMode: true
            }
        };

        // Store subscription
        this.#subscriptions.set(subscriptionId, subscription);

        console.log(`✅ [DummyPayment] Created subscription: ${subscriptionId} for plan: ${planName}`);

        return {
            success: true,
            subscriptionId,
            customerId,
            status: "active",
            currentPeriodEnd: subscription.currentPeriodEnd,
            metadata: subscription.metadata
        };
    }

    /**
     * Cancel a subscription (simulated)
     */
    async cancelSubscription(subscriptionId, immediately = false) {
        const subscription = this.#subscriptions.get(subscriptionId);

        if (!subscription) {
            return { success: false, error: "Subscription not found" };
        }

        const now = new Date();

        if (immediately) {
            subscription.status = "cancelled";
            subscription.cancelledAt = now;
            subscription.endedAt = now;
        } else {
            subscription.cancelAtPeriodEnd = true;
            subscription.cancelledAt = now;
        }

        console.log(`🛑 [DummyPayment] Cancelled subscription: ${subscriptionId} (immediately: ${immediately})`);

        return {
            success: true,
            cancelledAt: now,
            willCancelAt: immediately ? now : subscription.currentPeriodEnd,
            status: immediately ? "cancelled" : "active"
        };
    }

    /**
     * Update/upgrade a subscription plan (simulated)
     */
    async updateSubscription(subscriptionId, newPlanId, newAmount, prorated = true) {
        const subscription = this.#subscriptions.get(subscriptionId);

        if (!subscription) {
            return { success: false, error: "Subscription not found" };
        }

        const oldPlanName = subscription.planName;

        // Update subscription
        subscription.planId = newPlanId;
        subscription.amount = newAmount;
        subscription.updatedAt = new Date();

        // If upgrading, subscription remains active
        // In real provider, this might trigger proration charge

        console.log(`🔄 [DummyPayment] Updated subscription: ${subscriptionId} from ${oldPlanName} to plan ${newPlanId}`);

        return {
            success: true,
            subscriptionId,
            customerId: subscription.customerId,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            metadata: {
                ...subscription.metadata,
                previousPlan: oldPlanName,
                prorated
            }
        };
    }

    /**
     * Get subscription details
     */
    async getSubscription(subscriptionId) {
        const subscription = this.#subscriptions.get(subscriptionId);

        if (!subscription) {
            return { success: false, error: "Subscription not found" };
        }

        return {
            success: true,
            subscriptionId: subscription.id,
            customerId: subscription.customerId,
            status: subscription.status,
            planId: subscription.planId,
            planName: subscription.planName,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            metadata: subscription.metadata
        };
    }

    /**
     * Create or get a customer
     */
    async createOrGetCustomer(customerInfo) {
        const { email, name, phone } = customerInfo;

        // Check if customer exists by email
        for (const [userId, customerId] of this.#customers.entries()) {
            // In real implementation, we'd store email-to-customerId mapping
            if (customerId.includes(email?.slice(0, 5))) {
                return { customerId, isNew: false };
            }
        }

        const customerId = this.#generateId("cus");
        console.log(`👤 [DummyPayment] Created customer: ${customerId} for ${email}`);

        return { customerId, isNew: true };
    }

    /**
     * Validate webhook signature
     */
    validateWebhook(payload, signature) {
        // In dummy mode, we use a simple HMAC
        const expectedSignature = crypto
            .createHmac("sha256", this.#webhookSecret)
            .update(typeof payload === "string" ? payload : JSON.stringify(payload))
            .digest("hex");

        return signature === expectedSignature;
    }

    /**
     * Handle/parse webhook event
     */
    async handleWebhook(event) {
        const { type, data } = event;

        console.log(`📨 [DummyPayment] Received webhook: ${type}`);

        // Simulate different webhook event types
        switch (type) {
            case "subscription.created":
            case "subscription.updated":
            case "subscription.cancelled":
            case "invoice.paid":
            case "invoice.payment_failed":
                return {
                    valid: true,
                    eventType: type,
                    data
                };
            default:
                return {
                    valid: true,
                    eventType: "unknown",
                    data
                };
        }
    }

    /**
     * Simulate a refund
     */
    async refund(paymentId, amount = null) {
        console.log(`💸 [DummyPayment] Refund processed for payment: ${paymentId}, amount: ${amount || "full"}`);

        return {
            success: true,
            refundId: this.#generateId("ref")
        };
    }

    /**
     * Helper: Generate a test webhook payload with valid signature
     * (For testing purposes only)
     */
    generateTestWebhook(eventType, data) {
        const payload = { type: eventType, data, timestamp: Date.now() };
        const signature = crypto
            .createHmac("sha256", this.#webhookSecret)
            .update(JSON.stringify(payload))
            .digest("hex");

        return { payload, signature };
    }

    /**
     * Helper: Clear all test data
     * (For testing purposes only)
     */
    clearTestData() {
        this.#subscriptions.clear();
        this.#customers.clear();
        console.log("🧹 [DummyPayment] Cleared all test data");
    }
}

// Export singleton instance
export default new DummyPaymentProvider();

// Also export class for testing with fresh instances
export { DummyPaymentProvider };
