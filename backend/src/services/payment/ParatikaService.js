import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const PARATIKA_MERCHANT_ID = process.env.PARATIKA_MERCHANT_ID;
const PARATIKA_MERCHANT_USER = process.env.PARATIKA_MERCHANT_USER;
const PARATIKA_API_USER = process.env.PARATIKA_API_USER;
const PARATIKA_API_PASSWORD = process.env.PARATIKA_API_PASSWORD;
const PARATIKA_BASE_URL = process.env.PARATIKA_BASE_URL || "https://vpos.paratika.com.tr/paratika/api/v2";

// Final merchant user to use
const FINAL_MERCHANT_USER = PARATIKA_MERCHANT_USER || PARATIKA_API_USER || PARATIKA_MERCHANT_ID;

/**
 * Paratika Service for payment processing
 * Uses the Hosted Payment Page (HP) model — Paratika handles the card form.
 * Flow: createSession → redirect to HP → 3D Secure → callback to RETURNURL
 */
class ParatikaService {
    /**
     * Format amount in TRY to kuruş as an integer string (e.g. 369 -> "36900").
     */
    static formatAmount(val) {
        if (typeof val === "string") {
            val = val.replace(/,/g, ".");
        }
        const num = parseFloat(val);
        if (isNaN(num)) return "0";
        return String(Math.round(num * 100));
    }

    /**
     * Create a PAYMENTSESSION — returns a sessionToken for HP redirect.
     * No card data needed; Paratika's hosted page collects card info.
     * @param {Object} paymentData
     * @returns {Promise<Object>}
     */
    static async createSession(paymentData) {
        try {
            const formattedTotalAmount = this.formatAmount(paymentData.amount);

            const params = new URLSearchParams();
            params.append("ACTION", "SESSIONTOKEN");
            params.append("SESSIONTYPE", "PAYMENTSESSION");
            params.append("MERCHANT", PARATIKA_MERCHANT_ID);
            params.append("MERCHANTUSER", FINAL_MERCHANT_USER);
            params.append("MERCHANTPASSWORD", PARATIKA_API_PASSWORD);
            params.append("MERCHANTPAYMENTID", paymentData.merchantPaymentId);
            params.append("AMOUNT", formattedTotalAmount);
            params.append("CURRENCY", (paymentData.currency || "TRY").toUpperCase());

            // Return URL — where Paratika sends the user after payment
            params.append("RETURNURL", paymentData.returnUrl);

            // Customer Info
            params.append("CUSTOMER", paymentData.customerId || paymentData.email || "guest_user");
            params.append("CUSTOMERNAME", paymentData.customerName || "FinBot");
            params.append("CUSTOMEREMAIL", paymentData.email || "test@finbot.com.tr");
            params.append("CUSTOMERPHONE", paymentData.phone || "05555555555");

            // Normalize IP
            let ip = paymentData.ip || "127.0.0.1";
            if (ip === "::1" || ip === "localhost") ip = "127.0.0.1";
            if (ip.includes(',')) ip = ip.split(',')[0].trim();

            params.append("CUSTOMERIP", ip);
            params.append("CUSTOMERUSERAGENT", paymentData.userAgent || "Mozilla/5.0 (FinBot)");

            // Order Items
            const orderItems = [{
                name: paymentData.planName || "Subscription",
                description: paymentData.description || "Plan Access",
                quantity: "1",
                amount: formattedTotalAmount
            }];

            params.append("ORDERITEMS", JSON.stringify(orderItems));

            console.log(`[Paratika] Session request prepared (merchantPaymentId=${paymentData.merchantPaymentId}, amount_kurus=${formattedTotalAmount})`);

            const response = await axios.post(PARATIKA_BASE_URL, params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 15000
            });


            // Validate sessionToken
            if (response.data.responseCode === "00" && !response.data.sessionToken) {
                console.error("❌ Paratika returned 00 but NO sessionToken.");
                return {
                    ...response.data,
                    responseCode: "ERR_NO_TOKEN",
                    responseMsg: "Session token could not be generated."
                };
            }

            return response.data;
        } catch (error) {
            if (error.response) {
                console.error("❌ Paratika API Error:", error.response.status, error.response.data);
            } else {
                console.error("❌ Paratika Connection Error:", error.message);
            }
            throw error;
        }
    }

    /**
     * Query transaction status using QUERYTRANSACTION action.
     * Used after callback to verify the payment was actually approved.
     * @param {string} merchantPaymentId
     * @returns {Promise<Object>}
     */
    static async queryTransaction(merchantPaymentId) {
        try {
            const params = new URLSearchParams();
            params.append("ACTION", "QUERYTRANSACTION");
            params.append("MERCHANT", PARATIKA_MERCHANT_ID);
            params.append("MERCHANTUSER", FINAL_MERCHANT_USER);
            params.append("MERCHANTPASSWORD", PARATIKA_API_PASSWORD);
            params.append("MERCHANTPAYMENTID", merchantPaymentId);


            const response = await axios.post(PARATIKA_BASE_URL, params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 15000
            });


            return response.data;
        } catch (error) {
            console.error("❌ Paratika QueryTransaction Error:", error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Charge a stored card token (Non-3D recurring sale).
     * Used by subscription cron for automatic monthly renewals.
     * No 3D Secure redirect — runs silently in the background.
     * 
     * @param {Object} chargeData
     * @param {string} chargeData.cardToken - Stored card token from User.savedCards
     * @param {string} chargeData.amount - Amount to charge in TRY (e.g. "369.00")
     * @param {string} chargeData.currency - Currency code (default: TRY)
     * @param {string} chargeData.merchantPaymentId - Unique payment reference
     * @param {string} chargeData.customerId - User ID or Paratika customer ID
     * @param {string} chargeData.customerEmail - Customer email
     * @param {string} chargeData.customerName - Customer name
     * @param {string} chargeData.description - Payment description
     * @returns {Promise<Object>} Paratika API response
     */
    static async chargeWithToken(chargeData) {
        try {
            const formattedAmount = this.formatAmount(chargeData.amount);

            const params = new URLSearchParams();
            params.append("ACTION", "SALE");
            params.append("MERCHANT", PARATIKA_MERCHANT_ID);
            params.append("MERCHANTUSER", FINAL_MERCHANT_USER);
            params.append("MERCHANTPASSWORD", PARATIKA_API_PASSWORD);
            params.append("MERCHANTPAYMENTID", chargeData.merchantPaymentId);
            params.append("AMOUNT", formattedAmount);
            params.append("CURRENCY", (chargeData.currency || "TRY").toUpperCase());
            params.append("CARDTOKEN", chargeData.cardToken);

            // Customer info
            params.append("CUSTOMER", chargeData.customerId || "recurring_customer");
            params.append("CUSTOMERNAME", chargeData.customerName || "FinBot User");
            params.append("CUSTOMEREMAIL", chargeData.customerEmail || "");
            params.append("CUSTOMERIP", "127.0.0.1"); // Server-initiated
            params.append("CUSTOMERUSERAGENT", "FinBot-SubscriptionCron/1.0");

            console.log(`[Paratika] Token charge request prepared (merchantPaymentId=${chargeData.merchantPaymentId}, amount_kurus=${formattedAmount})`);

            const response = await axios.post(PARATIKA_BASE_URL, params, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                timeout: 30000
            });


            return response.data;
        } catch (error) {
            if (error.response) {
                console.error("❌ Paratika Token Sale API Error:", error.response.status, error.response.data);
            } else {
                console.error("❌ Paratika Token Sale Connection Error:", error.message);
            }
            throw error;
        }
    }
}

export default ParatikaService;
