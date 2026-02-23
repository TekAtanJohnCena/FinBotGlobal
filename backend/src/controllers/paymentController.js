import ParatikaService from "../services/payment/ParatikaService.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Subscription Plans Configuration
 */
const SUBSCRIPTION_PLANS = {
    BASIC: { amount: 199.00, name: "Basic Plan" },
    PLUS: { amount: 499.00, name: "Plus Plan" },
    PRO: { amount: 999.00, name: "Pro Plan" }
};

/**
 * Create a new payment session
 */
export const createPayment = async (req, res) => {
    try {
        console.log("!!! ÖDEME İSTEĞİ GELDİ !!!");
        console.log("Body:", JSON.stringify(req.body, null, 2));
        console.log("User:", req.user?.email);

        const { planType, billingPeriod, cardHolderName, cardNumber, expireMonth, expireYear, cvv } = req.body;
        const userId = req.user?.id;
        const userEmail = req.user?.email;

        // Use uuidv4() as requested for robust uniqueness and to avoid crypto.randomUUID issues in some Node versions
        const merchantPaymentId = `FIN-${Date.now()}-${uuidv4().split('-')[0]}`;
        console.log(`🆔 Generated MerchantPaymentID: ${merchantPaymentId}`);

        // 0. Validate Plan and Get Amount
        const plan = SUBSCRIPTION_PLANS[planType];
        if (!plan) {
            return res.status(400).json({ success: false, message: "Invalid subscription plan selected." });
        }
        const amount = plan.amount;

        // 1. Log the transaction as PENDING in MongoDB
        const transaction = await PaymentTransaction.create({
            user: userId,
            merchantPaymentId,
            amount,
            currency: "TRY",
            status: "PENDING",
            planType,
            billingPeriod: billingPeriod || "MONTHLY",
            customerInfo: {
                name: cardHolderName,
                email: userEmail
            }
        });

        // 2. Call Paratika to initiate payment
        const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
        console.log(`🚀 Calling Paratika for transaction: ${merchantPaymentId}`);

        const result = await ParatikaService.initiatePayment({
            merchantPaymentId,
            amount: amount.toFixed(2),
            currency: "TRY",
            email: userEmail,
            ip: req.ip,
            returnUrl: `${backendUrl}/api/payment/callback`,
            cardHolderName,
            planName: plan.name,
            description: `1 Month ${plan.name} Access`,
            customerId: userId,
            cardNumber,
            expireMonth,
            expireYear,
            cvv
        });

        console.log("📥 Paratika Service Result:", JSON.stringify(result, null, 2));

        // 3. Store session token and update transaction
        if (result && result.sessionToken) {
            transaction.sessionToken = result.sessionToken;
            transaction.rawResponse = result;
            await transaction.save();

            // Paratika V2 standard redirect URL for SESSIONTOKEN
            const redirectUrl = `https://vpos.paratika.com.tr/paratika/api/v2/redirect/session/${result.sessionToken}`;
            console.log(`✅ Redirecting user to: ${redirectUrl}`);

            return res.status(200).json({
                success: true,
                redirectUrl,
                merchantPaymentId
            });
        } else {
            console.log("❌ Paratika Session Creation Failed. Response:", JSON.stringify(result, null, 2));
            transaction.status = "FAILED";
            transaction.errorMsg = result.responseMsg || "Failed to generate session";
            transaction.rawResponse = result;
            await transaction.save();

            return res.status(400).json({
                success: false,
                message: transaction.errorMsg,
                debug: result // Optional: only for dev
            });
        }

    } catch (error) {
        console.error("Create Payment Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

/**
 * Handle POST callback from Paratika after 3D Secure
 */
export const handleCallback = async (req, res) => {
    try {
        console.log("🔔 PARATIKA CALLBACK RECEIVED");
        console.log("Body:", JSON.stringify(req.body, null, 2));

        const { merchantPaymentId, responseCode, responseMsg } = req.body;

        if (!merchantPaymentId) {
            console.error("❌ Callback Error: Missing merchantPaymentId in body");
            return res.status(400).send("Missing merchantPaymentId");
        }

        console.log(`Transaction ID: ${merchantPaymentId}, Code: ${responseCode}, Msg: ${responseMsg}`);

        // 1. Immediately call QUERYTRANSACTION for verification
        const queryResult = await ParatikaService.queryTransaction(merchantPaymentId);

        // 2. Find transaction in DB
        const transaction = await PaymentTransaction.findOne({ merchantPaymentId });
        if (!transaction) {
            return res.status(404).send("Transaction not found");
        }

        // 3. Update transaction status
        transaction.rawResponse = queryResult;

        if (queryResult.responseCode === "00") {
            transaction.status = "SUCCESS";
            transaction.isVerified = true;
        } else {
            transaction.status = "FAILED";
            transaction.errorMsg = queryResult.responseMsg;
        }

        await transaction.save();

        // 4. Redirect user back to frontend
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const status = transaction.status === "SUCCESS" ? "success" : "failed";

        res.redirect(`${frontendUrl}/payment-status?status=${status}&id=${merchantPaymentId}`);

    } catch (error) {
        console.error("Payment Callback Error:", error);
        res.status(500).send("Verification Error");
    }
};
