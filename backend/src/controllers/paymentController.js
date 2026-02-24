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
 * Create a new payment session (HP model — no card data needed)
 * Frontend will redirect user to Paratika Hosted Payment Page
 */
export const createPayment = async (req, res) => {
    try {
        console.log("!!! ÖDEME İSTEĞİ GELDİ !!!");
        console.log("Body:", JSON.stringify(req.body, null, 2));
        console.log("User:", req.user?.email);

        const { planType, billingPeriod } = req.body;
        const userId = req.user?.id;
        const userEmail = req.user?.email;
        const userName = req.user?.firstName || req.user?.fullName || "FinBot User";

        // Validate Plan
        const plan = SUBSCRIPTION_PLANS[planType];
        if (!plan) {
            return res.status(400).json({ success: false, message: "Geçersiz abonelik planı." });
        }

        // Calculate amount based on billing period
        let amount = plan.amount;
        if (billingPeriod === "YEARLY") {
            amount = parseFloat((plan.amount * YEARLY_MULTIPLIER).toFixed(2));
        }

        // Generate unique payment ID
        const merchantPaymentId = `FIN-${Date.now()}-${uuidv4().split('-')[0]}`;
        console.log(`🆔 MerchantPaymentID: ${merchantPaymentId}`);

        // Log the transaction as PENDING
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

        // Build callback URL (backend receives the Paratika POST/redirect)
        const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";

        // Call Paratika to get session token
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
            planName: plan.name,
            description: `${billingPeriod === "YEARLY" ? "Yıllık" : "Aylık"} ${plan.name}`
        });

        console.log("📥 Paratika Result:", JSON.stringify(result, null, 2));

        if (result && result.sessionToken) {
            transaction.sessionToken = result.sessionToken;
            transaction.rawResponse = result;
            await transaction.save();

            // CORRECT redirect URL: Non-Direct POST HP model
            // This is the Paratika Hosted Payment Page where user enters card info
            const redirectUrl = `https://vpos.paratika.com.tr/merchant/post/sale/${result.sessionToken}`;
            console.log(`✅ Redirecting user to Paratika HP: ${redirectUrl}`);

            return res.status(200).json({
                success: true,
                redirectUrl
            });
        } else {
            console.log("❌ Session creation failed:", JSON.stringify(result, null, 2));
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
 * We handle both cases.
 */
export const handleCallback = async (req, res) => {
    try {
        // Merge query params and body for flexibility
        const data = { ...req.query, ...req.body };

        console.log("═══════════════════════════════════════════════");
        console.log("🔔 PARATIKA CALLBACK RECEIVED");
        console.log("Method:", req.method);
        console.log("Headers Origin:", req.headers.origin);
        console.log("Content-Type:", req.headers['content-type']);
        console.log("ALL DATA KEYS:", Object.keys(data));
        console.log("ALL DATA:", JSON.stringify(data, null, 2));
        console.log("═══════════════════════════════════════════════");

        // Paratika may use various field name formats — check all
        const merchantPaymentId = data.merchantPaymentId || data.MERCHANTPAYMENTID
            || data.MerchantPaymentId || data.pgOrderId || data.PGORDERID;
        const responseCode = data.responseCode || data.RESPONSECODE || data.ResponseCode;
        const responseMsg = data.responseMsg || data.RESPONSEMSG || data.ResponseMsg;

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

        if (!merchantPaymentId) {
            console.error("❌ Callback: Missing merchantPaymentId. Available keys:", Object.keys(data));
            return res.redirect(`${frontendUrl}/payment-status?status=failed&error=missing_id`);
        }

        console.log(`📋 Transaction: ${merchantPaymentId}, Code: ${responseCode}, Msg: ${responseMsg}`);

        // Find transaction in DB
        const transaction = await PaymentTransaction.findOne({ merchantPaymentId });
        if (!transaction) {
            // Try finding by sessionToken as fallback
            const sessionToken = data.sessionToken || data.SESSIONTOKEN;
            let txBySession = null;
            if (sessionToken) {
                txBySession = await PaymentTransaction.findOne({ sessionToken });
            }

            if (!txBySession) {
                console.error("❌ Transaction not found:", merchantPaymentId);
                return res.redirect(`${frontendUrl}/payment-status?status=failed&error=not_found&id=${merchantPaymentId}`);
            }

            // Use the session-matched transaction
            console.log("✅ Found transaction via sessionToken fallback");
            return await processTransaction(txBySession, data, responseCode, frontendUrl, res);
        }

        return await processTransaction(transaction, data, responseCode, frontendUrl, res);

    } catch (error) {
        console.error("Payment Callback Error:", error);
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        res.redirect(`${frontendUrl}/payment-status?status=failed&error=server_error`);
    }
};

/**
 * Process a transaction callback — shared logic
 */
async function processTransaction(transaction, data, responseCode, frontendUrl, res) {
    const merchantPaymentId = transaction.merchantPaymentId;

    // Verify with QUERYTRANSACTION (double-check with Paratika)
    let verified = false;
    try {
        const queryResult = await ParatikaService.queryTransaction(merchantPaymentId);
        console.log("📥 QUERYTRANSACTION full response:", JSON.stringify(queryResult, null, 2));
        transaction.rawResponse = queryResult;

        if (queryResult.responseCode === "00") {
            // Check transactionList for AP (Approved) status
            const txList = queryResult.transactionList || [];
            const approvedTx = txList.find(tx => tx.transactionStatus === "AP");

            if (approvedTx) {
                verified = true;
                transaction.status = "SUCCESS";
                transaction.isVerified = true;
                console.log("✅ Transaction VERIFIED via QUERYTRANSACTION");
            } else if (txList.length === 0 && responseCode === "00") {
                verified = true;
                transaction.status = "SUCCESS";
                transaction.isVerified = true;
                console.log("✅ Transaction approved (responseCode 00, no txList yet)");
            } else {
                // Log all transaction statuses for debugging
                console.log("📊 Transaction statuses:", txList.map(t => `${t.pgTranId}: ${t.transactionStatus}`));
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
        // Fall back to callback responseCode if query fails
        if (responseCode === "00") {
            verified = true;
            transaction.status = "SUCCESS";
            transaction.isVerified = false;
            console.log("⚠️ Using callback responseCode as fallback (not fully verified)");
        } else {
            transaction.status = "FAILED";
            transaction.errorMsg = `Doğrulama yapılamadı: ${responseCode}`;
        }
    }

    await transaction.save();

    // If payment succeeded, upgrade user subscription
    if (verified) {
        try {
            const user = await User.findById(transaction.user);
            if (user) {
                user.subscriptionTier = transaction.planType;
                user.subscriptionStatus = "ACTIVE";
                await user.save();
                console.log(`🎉 User ${user.email} upgraded to ${transaction.planType}`);
            }
        } catch (updateError) {
            console.error("❌ User subscription update error:", updateError.message);
        }
    }

    // Redirect user to frontend payment status page
    const status = transaction.status === "SUCCESS" ? "success" : "failed";
    console.log(`🔀 Redirecting to: /payment-status?status=${status}&id=${merchantPaymentId}`);
    res.redirect(`${frontendUrl}/payment-status?status=${status}&id=${merchantPaymentId}`);
}


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

        // Also query Paratika for latest status
        try {
            const queryResult = await ParatikaService.queryTransaction(merchantPaymentId);
            return res.json({
                success: true,
                transaction: {
                    status: transaction.status,
                    amount: transaction.amount,
                    planType: transaction.planType,
                    createdAt: transaction.createdAt
                },
                paratikaStatus: queryResult
            });
        } catch {
            return res.json({
                success: true,
                transaction: {
                    status: transaction.status,
                    amount: transaction.amount,
                    planType: transaction.planType,
                    createdAt: transaction.createdAt
                }
            });
        }

    } catch (error) {
        console.error("Query Payment Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
