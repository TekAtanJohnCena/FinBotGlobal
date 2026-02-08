const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * Shopier Payment Integration Routes
 * 
 * These routes handle payment processing through Shopier payment infrastructure.
 * 
 * IMPORTANT: This is a scaffold. You need to:
 * 1. Register with Shopier and get API credentials
 * 2. Add credentials to .env file
 * 3. Implement actual Shopier API calls in shopierService.js
 */

// Initialize payment session
router.post('/create-session', authenticateToken, async (req, res) => {
    try {
        const { planType, billingPeriod } = req.body;
        const userId = req.user.id;
        const userEmail = req.user.email;

        // Validate plan type
        const validPlans = ['plus', 'pro', 'enterprise'];
        if (!validPlans.includes(planType)) {
            return res.status(400).json({
                success: false,
                error: 'Geçersiz paket tipi'
            });
        }

        // Get price based on plan and billing period
        const prices = {
            plus: { monthly: 369, yearly: 3541 }, // 369 * 12 * 0.80
            pro: { monthly: 449, yearly: 4310 },  // 449 * 12 * 0.80
            enterprise: { monthly: null, yearly: null }
        };

        const price = prices[planType][billingPeriod];

        if (price === null) {
            return res.status(400).json({
                success: false,
                error: 'Enterprise paket için iletişime geçin'
            });
        }

        // TODO: Implement actual Shopier session creation
        // const shopierService = require('../services/shopierService');
        // const paymentSession = await shopierService.createPaymentSession({
        //   amount: price,
        //   currency: 'TRY',
        //   userId,
        //   userEmail,
        //   planType,
        //   billingPeriod,
        //   description: `FinBot ${planType.toUpperCase()} - ${billingPeriod === 'monthly' ? 'Aylık' : 'Yıllık'} Abonelik`
        // });

        // Temporary response - Replace with actual Shopier redirect URL
        res.json({
            success: true,
            message: 'Ödeme entegrasyonu hazırlanıyor',
            data: {
                planType,
                billingPeriod,
                amount: price,
                currency: 'TRY',
                // paymentUrl: paymentSession.redirectUrl // Shopier redirect URL
            }
        });

    } catch (error) {
        console.error('Payment session creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Ödeme oturumu oluşturulamadı'
        });
    }
});

// Shopier webhook callback
router.post('/webhook', async (req, res) => {
    try {
        const webhookData = req.body;

        // TODO: Verify Shopier webhook signature
        // const shopierService = require('../services/shopierService');
        // const isValid = shopierService.verifyWebhookSignature(req);
        // if (!isValid) {
        //   return res.status(401).json({ error: 'Invalid signature' });
        // }

        console.log('Shopier webhook received:', webhookData);

        // TODO: Process payment result
        // - Update user subscription in database
        // - Send confirmation email
        // - Create invoice record

        res.json({ success: true });

    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// Payment success callback page
router.get('/success', (req, res) => {
    // Redirect to frontend success page
    res.redirect('/settings?payment=success');
});

// Payment failure callback page
router.get('/failure', (req, res) => {
    // Redirect to frontend with error
    res.redirect('/pricing?payment=failed');
});

module.exports = router;
