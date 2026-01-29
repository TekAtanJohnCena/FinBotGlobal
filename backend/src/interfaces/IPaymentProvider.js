// PATH: backend/src/interfaces/IPaymentProvider.js
/**
 * IPaymentProvider - Payment Gateway Interface
 * 
 * This interface defines the contract that ALL payment providers must implement.
 * By using this abstraction, we can swap payment providers (Param, NKolay, Stripe, etc.)
 * without changing any business logic.
 * 
 * Design Pattern: Strategy Pattern for Payment Processing
 * 
 * @interface IPaymentProvider
 * @module interfaces/IPaymentProvider
 */

/**
 * @typedef {Object} SubscriptionResult
 * @property {boolean} success - Whether the operation was successful
 * @property {string} subscriptionId - External subscription ID from provider
 * @property {string} customerId - External customer ID from provider
 * @property {string} status - Subscription status
 * @property {Date} currentPeriodEnd - When current billing period ends
 * @property {Object} metadata - Provider-specific metadata
 */

/**
 * @typedef {Object} PaymentDetails
 * @property {string} [cardToken] - Tokenized card from frontend
 * @property {string} [cardNumber] - Card number (for testing only)
 * @property {string} [expiryMonth] - Card expiry month
 * @property {string} [expiryYear] - Card expiry year
 * @property {string} [cvv] - Card CVV (for testing only)
 * @property {Object} [billingAddress] - Billing address details
 */

/**
 * @typedef {Object} WebhookResult
 * @property {boolean} valid - Whether webhook signature is valid
 * @property {string} eventType - Type of webhook event
 * @property {Object} data - Parsed webhook data
 */

/**
 * Abstract Payment Provider Interface
 * All payment providers must extend this class and implement all methods
 */
class IPaymentProvider {
    /**
     * Provider name identifier
     * @type {string}
     */
    name = "base";

    /**
     * Create a new subscription for a user
     * 
     * @param {Object} params - Subscription parameters
     * @param {string} params.userId - Internal user ID
     * @param {string} params.planId - Internal plan ID
     * @param {string} params.planName - Plan name (FREE, PLUS, PRO)
     * @param {number} params.amount - Amount to charge
     * @param {string} params.currency - Currency code (TRY, USD, etc.)
     * @param {string} params.interval - Billing interval (monthly, yearly)
     * @param {PaymentDetails} params.paymentDetails - Payment information
     * @param {Object} [params.customerInfo] - Customer information
     * @returns {Promise<SubscriptionResult>}
     */
    async createSubscription(params) {
        throw new Error("Method 'createSubscription' must be implemented by provider");
    }

    /**
     * Cancel an existing subscription
     * 
     * @param {string} subscriptionId - External subscription ID
     * @param {boolean} [immediately=false] - Cancel immediately or at period end
     * @returns {Promise<{ success: boolean, cancelledAt: Date, willCancelAt: Date }>}
     */
    async cancelSubscription(subscriptionId, immediately = false) {
        throw new Error("Method 'cancelSubscription' must be implemented by provider");
    }

    /**
     * Update/change a subscription plan (upgrade/downgrade)
     * 
     * @param {string} subscriptionId - External subscription ID
     * @param {string} newPlanId - New plan ID
     * @param {number} newAmount - New amount to charge
     * @param {boolean} [prorated=true] - Apply proration
     * @returns {Promise<SubscriptionResult>}
     */
    async updateSubscription(subscriptionId, newPlanId, newAmount, prorated = true) {
        throw new Error("Method 'updateSubscription' must be implemented by provider");
    }

    /**
     * Get subscription details from provider
     * 
     * @param {string} subscriptionId - External subscription ID
     * @returns {Promise<SubscriptionResult>}
     */
    async getSubscription(subscriptionId) {
        throw new Error("Method 'getSubscription' must be implemented by provider");
    }

    /**
     * Create or get a customer in the payment provider
     * 
     * @param {Object} customerInfo - Customer information
     * @param {string} customerInfo.email - Customer email
     * @param {string} customerInfo.name - Customer name
     * @param {string} [customerInfo.phone] - Customer phone
     * @returns {Promise<{ customerId: string, isNew: boolean }>}
     */
    async createOrGetCustomer(customerInfo) {
        throw new Error("Method 'createOrGetCustomer' must be implemented by provider");
    }

    /**
     * Validate webhook signature
     * 
     * @param {string|Buffer} payload - Raw webhook payload
     * @param {string} signature - Webhook signature from headers
     * @returns {boolean}
     */
    validateWebhook(payload, signature) {
        throw new Error("Method 'validateWebhook' must be implemented by provider");
    }

    /**
     * Handle and parse webhook event
     * 
     * @param {Object} event - Parsed webhook event
     * @returns {Promise<WebhookResult>}
     */
    async handleWebhook(event) {
        throw new Error("Method 'handleWebhook' must be implemented by provider");
    }

    /**
     * Refund a payment
     * 
     * @param {string} paymentId - Payment/transaction ID
     * @param {number} [amount] - Amount to refund (partial refund if specified)
     * @returns {Promise<{ success: boolean, refundId: string }>}
     */
    async refund(paymentId, amount = null) {
        throw new Error("Method 'refund' must be implemented by provider");
    }
}

export default IPaymentProvider;
