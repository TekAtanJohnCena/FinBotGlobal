import ParatikaService from "../services/payment/ParatikaService.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import User from "../models/userModel.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Subscription Plans Configuration
 */
const SUBSCRIPTION_PLANS = {
    PLUS: { amount: 369.00, name: "Plus Plan" },
    PRO: { amount: 449.00, name: "Pro Plan" }
};

// Yearly prices with 20% discount
const YEARLY_MULTIPLIER = 12 * 0.80;

/**
 * Get frontend URL with protocol safety
 */
function getFrontendUrl() {
    let url = process.env.FRONTEND_URL || "http://localhost:3000";
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
    }
    return url.replace(/\/+$/, '');
}

/**
 * Create a new payment session (Direct POST 3D model)
 * Backend only creates sessionToken — card data handled client-side
 */
export const createPayment = async (req, res) => {
    try {
        console.log("!!! ÖDEME İSTEĞİ GELDİ !!!");
        console.log("Body:", JSON.stringify(req.body, null, 2));
        console.log("User:", req.user?.email);

        const { planType, billingPeriod } = req.body;
        const userId = req.user?.id;
        const userEmail = req.user?.email;
        const userName = req.user?.firstName || "FinBot User";

        if (!planType || !SUBSCRIPTION_PLANS[planType]) {
            return res.status(400).json({ success: false, message: "Geçersiz plan seçimi." });
        }

        const plan = SUBSCRIPTION_PLANS[planType];
        let amount = plan.amount;

        // Apply yearly discount if applicable
        if (billingPeriod === "YEARLY") {
            amount = plan.amount * YEARLY_MULTIPLIER;
        }

        const merchantPaymentId = `FIN-${Date.now()}-${uuidv4().split('-')[0]}`;
        console.log(`🆔 MerchantPaymentID: ${merchantPaymentId}`);

        // 1. Create transaction record in DB
        const transaction = await PaymentTransaction.create({
            user: userId,
            merchantPaymentId,
            amount,
            currency: "TRY",
            status: "PENDING",
            planType,
            billingPeriod: billingPeriod || "MONTHLY",
            customerInfo: {
                name: userName,
                email: userEmail
            }
        });

        // 2. Call Paratika to create session token
        const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
        const result = await ParatikaService.createSession({
            merchantPaymentId,
            amount: amount.toFixed(2),
            currency: "TRY",
            email: userEmail,
            customerName: userName,
            customerId: userId,
            ip: req.headers['x-forwarded-for'] || req.ip,
            userAgent: req.headers['user-agent'],
            returnUrl: `${backendUrl}/api/payment/callback`,
            planName: billingPeriod === "YEARLY" ? `${plan.name} (Yıllık)` : plan.name,
            description: billingPeriod === "YEARLY"
                ? `Yıllık ${plan.name} Aboneliği`
                : `Aylık ${plan.name} Aboneliği`
        });

        console.log("📥 Paratika Result:", JSON.stringify(result, null, 2));

        // 3. Handle response
        if (result && result.sessionToken) {
            transaction.sessionToken = result.sessionToken;
            transaction.rawResponse = result;
            await transaction.save();

            // Direct POST 3D: Frontend will POST card data directly to this URL
            const redirectUrl = `https://vpos.paratika.com.tr/paratika/api/v2/post/sale3d/${result.sessionToken}`;
            console.log(`✅ Redirecting user to Paratika: ${redirectUrl}`);

            return res.status(200).json({
                success: true,
                redirectUrl,
                sessionToken: result.sessionToken
            });
        } else {
            console.log("❌ Paratika Session Failed:", JSON.stringify(result, null, 2));
            transaction.status = "FAILED";
            transaction.errorMsg = result?.responseMsg || "Session oluşturulamadı";
            transaction.rawResponse = result;
            await transaction.save();

            return res.status(400).json({
                success: false,
                message: transaction.errorMsg
            });
        }

    } catch (error) {
        console.error("Create Payment Error:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası" });
    }
};

/**
 * Handle callback from Paratika after 3D Secure completion.
 * Paratika POSTs form data to RETURNURL, or redirects via GET.
 */
export const handleCallback = async (req, res) => {
    try {
        // Merge query params and body for flexibility
        const data = { ...req.query, ...req.body };

        console.log("═══════════════════════════════════════════════");
        console.log("🔔 PARATIKA CALLBACK RECEIVED");
        console.log("Method:", req.method);
        console.log("ALL DATA KEYS:", Object.keys(data));
        console.log("ALL DATA:", JSON.stringify(data, null, 2));
        console.log("═══════════════════════════════════════════════");

        // Paratika may use various field name formats — check all
        const merchantPaymentId = data.merchantPaymentId || data.MERCHANTPAYMENTID
            || data.MerchantPaymentId || data.pgOrderId || data.PGORDERID;
        const responseCode = data.responseCode || data.RESPONSECODE || data.ResponseCode;
        const responseMsg = data.responseMsg || data.RESPONSEMSG || data.ResponseMsg;
        const sessionToken = data.sessionToken || data.SESSIONTOKEN;

        const frontendUrl = getFrontendUrl();

        if (!merchantPaymentId) {
            console.error("❌ Callback: Missing merchantPaymentId. Keys:", Object.keys(data));
            return res.redirect(`${frontendUrl}/payment-status?status=failed&error=missing_id`);
        }

        console.log(`📋 Transaction: ${merchantPaymentId}, Code: ${responseCode}, Msg: ${responseMsg}`);

        // Find transaction in DB
        let transaction = await PaymentTransaction.findOne({ merchantPaymentId });

        // Fallback: try finding by sessionToken
        if (!transaction && sessionToken) {
            transaction = await PaymentTransaction.findOne({ sessionToken });
            if (transaction) {
                console.log("✅ Found transaction via sessionToken fallback");
            }
        }

        if (!transaction) {
            console.error("❌ Transaction not found:", merchantPaymentId);
            return res.redirect(`${frontendUrl}/payment-status?status=failed&error=not_found&id=${merchantPaymentId}`);
        }

        // Verify with QUERYTRANSACTION (double-check with Paratika)
        let verified = false;
        try {
            const queryResult = await ParatikaService.queryTransaction(transaction.merchantPaymentId);
            console.log("📥 QUERYTRANSACTION response:", JSON.stringify(queryResult, null, 2));
            transaction.rawResponse = queryResult;

            if (queryResult.responseCode === "00") {
                const txList = queryResult.transactionList || [];
                const approvedTx = txList.find(tx => tx.transactionStatus === "AP");

                if (approvedTx) {
                    verified = true;
                    transaction.status = "SUCCESS";
                    transaction.isVerified = true;
                    console.log("✅ Transaction VERIFIED via QUERYTRANSACTION (AP)");
                } else if (txList.length === 0 && responseCode === "00") {
                    // No transactionList yet but Paratika callback says 00
                    verified = true;
                    transaction.status = "SUCCESS";
                    transaction.isVerified = true;
                    console.log("✅ Transaction approved (responseCode 00, no txList yet)");
                } else {
                    const statuses = txList.map(t => `${t.pgTranId || 'N/A'}: ${t.transactionStatus}`);
                    console.log("📊 Transaction statuses:", statuses);
                    transaction.status = "FAILED";
                    transaction.errorMsg = "İşlem doğrulanamadı";
                    console.log("❌ No approved transaction in list");
                }
            } else {
                transaction.status = "FAILED";
                transaction.errorMsg = queryResult.responseMsg || "İşlem başarısız";
                console.log("❌ QUERYTRANSACTION failed:", queryResult.responseCode, queryResult.responseMsg);
            }
        } catch (queryError) {
            console.error("❌ QUERYTRANSACTION error:", queryError.message);
            // Fall back to callback responseCode
            if (responseCode === "00") {
                verified = true;
                transaction.status = "SUCCESS";
                transaction.isVerified = false; // Not fully verified
                console.log("⚠️ Using callback responseCode as fallback");
            } else {
                transaction.status = "FAILED";
                transaction.errorMsg = `Doğrulama hatası: ${responseCode}`;
            }
        }

        await transaction.save();

        // If payment succeeded → upgrade user subscription
        if (verified) {
            try {
                const user = await User.findById(transaction.user);
                if (user) {
                    user.subscriptionTier = transaction.planType; // "PLUS" or "PRO"
                    user.subscriptionStatus = "ACTIVE";
                    await user.save();
                    console.log(`🎉 User ${user.email} upgraded to ${transaction.planType}`);
                }
            } catch (updateError) {
                console.error("❌ User subscription update error:", updateError.message);
                // Payment still succeeded, don't fail the redirect
            }
        }

        // Redirect user to frontend payment status page
        const status = transaction.status === "SUCCESS" ? "success" : "failed";
        console.log(`🔀 Redirecting to: ${frontendUrl}/payment-status?status=${status}&id=${transaction.merchantPaymentId}`);
        res.redirect(`${frontendUrl}/payment-status?status=${status}&id=${transaction.merchantPaymentId}`);

    } catch (error) {
        console.error("Payment Callback Error:", error);
        const frontendUrl = getFrontendUrl();
        res.redirect(`${frontendUrl}/payment-status?status=failed&error=server_error`);
    }
};

/**
 * Query a transaction status (for frontend polling or manual check)
 */
export const queryPayment = async (req, res) => {
    try {
        const { merchantPaymentId } = req.params;

        if (!merchantPaymentId) {
            return res.status(400).json({ success: false, message: "Missing merchantPaymentId" });
        }

        const transaction = await PaymentTransaction.findOne({ merchantPaymentId });
        if (!transaction) {
            return res.status(404).json({ success: false, message: "Transaction not found" });
        }

        // Optionally re-query Paratika for latest status
        try {
            const queryResult = await ParatikaService.queryTransaction(merchantPaymentId);

            if (queryResult.responseCode === "00") {
                const txList = queryResult.transactionList || [];
                const approvedTx = txList.find(tx => tx.transactionStatus === "AP");

                if (approvedTx && transaction.status !== "SUCCESS") {
                    transaction.status = "SUCCESS";
                    transaction.isVerified = true;
                    transaction.rawResponse = queryResult;
                    await transaction.save();

                    // Also upgrade user subscription
                    await upgradeUserSubscription(transaction);
                }
            }
        } catch (queryError) {
            console.error("Query Paratika error:", queryError.message);
        }

        res.json({
            success: true,
            transaction: {
                merchantPaymentId: transaction.merchantPaymentId,
                status: transaction.status,
                amount: transaction.amount,
                planType: transaction.planType,
                isVerified: transaction.isVerified,
                createdAt: transaction.createdAt
            }
        });
    } catch (error) {
        console.error("Query Payment Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * Helper: Upgrade user subscription after successful payment
 */
async function upgradeUserSubscription(transaction) {
    try {
        const user = await User.findById(transaction.user);
        if (user && user.subscriptionTier !== transaction.planType) {
            user.subscriptionTier = transaction.planType;
            user.subscriptionStatus = "ACTIVE";
            await user.save();
            console.log(`🎉 User ${user.email} upgraded to ${transaction.planType}`);
        }
    } catch (err) {
        console.error("❌ upgradeUserSubscription error:", err.message);
    }
}
