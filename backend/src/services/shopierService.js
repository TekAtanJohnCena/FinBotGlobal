/**
 * Shopier Payment Service
 * 
 * This service handles all interactions with Shopier payment API.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Register at https://www.shopier.com/
 * 2. Get your API Key and Secret from Shopier dashboard
 * 3. Add to your .env file:
 *    SHOPIER_API_KEY=your_api_key
 *    SHOPIER_API_SECRET=your_api_secret
 *    SHOPIER_WEBHOOK_SECRET=your_webhook_secret
 *    SHOPIER_CALLBACK_URL=https://finbot.com.tr/api/payment
 * 
 * IMPORTANT: This is a scaffold. Implement actual Shopier API calls
 * based on their documentation after receiving API credentials.
 */

const crypto = require('crypto');

class ShopierService {
    constructor() {
        this.apiKey = process.env.SHOPIER_API_KEY;
        this.apiSecret = process.env.SHOPIER_API_SECRET;
        this.webhookSecret = process.env.SHOPIER_WEBHOOK_SECRET;
        this.callbackUrl = process.env.SHOPIER_CALLBACK_URL || 'https://finbot.com.tr/api/payment';
    }

    /**
     * Create a payment session with Shopier
     * @param {Object} options Payment options
     * @returns {Promise<Object>} Payment session with redirect URL
     */
    async createPaymentSession(options) {
        const {
            amount,
            currency = 'TRY',
            userId,
            userEmail,
            planType,
            billingPeriod,
            description
        } = options;

        // Generate unique order ID
        const orderId = `FINBOT-${userId}-${Date.now()}`;

        // TODO: Implement actual Shopier API call
        // Reference: Shopier API documentation

        // Example payload structure (adjust based on Shopier docs):
        const payload = {
            api_key: this.apiKey,
            order_id: orderId,
            amount: amount * 100, // Convert to kuruş
            currency: currency,
            email: userEmail,
            description: description,
            callback_url: `${this.callbackUrl}/webhook`,
            success_url: `${this.callbackUrl}/success?order=${orderId}`,
            fail_url: `${this.callbackUrl}/failure?order=${orderId}`,
            metadata: {
                user_id: userId,
                plan_type: planType,
                billing_period: billingPeriod
            }
        };

        // TODO: Sign the request and make API call
        // const signature = this.generateSignature(payload);
        // const response = await fetch('https://api.shopier.com/v1/payment/create', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'X-Shopier-Signature': signature
        //   },
        //   body: JSON.stringify(payload)
        // });

        // Placeholder return
        return {
            orderId,
            amount,
            redirectUrl: null, // Will be provided by Shopier API
            expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 min expiry
        };
    }

    /**
     * Verify Shopier webhook signature
     * @param {Object} req Express request object
     * @returns {boolean} Whether signature is valid
     */
    verifyWebhookSignature(req) {
        const signature = req.headers['x-shopier-signature'];
        if (!signature) return false;

        const payload = JSON.stringify(req.body);
        const computedSignature = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(payload)
            .digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(computedSignature)
        );
    }

    /**
     * Generate signature for API requests
     * @param {Object} payload Request payload
     * @returns {string} HMAC signature
     */
    generateSignature(payload) {
        return crypto
            .createHmac('sha256', this.apiSecret)
            .update(JSON.stringify(payload))
            .digest('hex');
    }

    /**
     * Process successful payment
     * @param {Object} webhookData Webhook data from Shopier
     * @returns {Promise<Object>} Processing result
     */
    async processSuccessfulPayment(webhookData) {
        const { order_id, transaction_id, amount, metadata } = webhookData;

        // TODO: Implement subscription activation
        // 1. Find user by metadata.user_id
        // 2. Update user subscription tier
        // 3. Set subscription expiry date
        // 4. Create payment record
        // 5. Send confirmation email

        console.log(`Processing payment: ${order_id}, transaction: ${transaction_id}`);

        return {
            success: true,
            orderId: order_id,
            transactionId: transaction_id
        };
    }

    /**
     * Handle failed payment
     * @param {Object} webhookData Webhook data from Shopier
     */
    async handleFailedPayment(webhookData) {
        const { order_id, error_code, error_message } = webhookData;

        console.error(`Payment failed: ${order_id}`, { error_code, error_message });

        // TODO: Log failed payment attempt
        // TODO: Optionally send notification to user
    }
}

module.exports = new ShopierService();
