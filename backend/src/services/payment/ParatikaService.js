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
     * Format any number or string to a "X.XX" string as required by Paratika.
     */
    static formatAmount(val) {
        if (typeof val === "string") {
            val = val.replace(/,/g, ".");
        }
        const num = parseFloat(val);
        if (isNaN(num)) return "0.00";
        return num.toFixed(2);
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

            console.log("🚀 PARATIKA SESSION REQUEST:");
            for (const [k, v] of params.entries()) {
                if (!k.includes("PASSWORD")) console.log(`   ${k}: ${v}`);
            }

            const response = await axios.post(PARATIKA_BASE_URL, params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 15000
            });

            console.log("✅ PARATIKA RESPONSE:", JSON.stringify(response.data, null, 2));

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

            console.log(`🔍 QUERYTRANSACTION for: ${merchantPaymentId}`);

            const response = await axios.post(PARATIKA_BASE_URL, params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 15000
            });

            console.log("✅ QUERYTRANSACTION RESPONSE:", JSON.stringify(response.data, null, 2));

            return response.data;
        } catch (error) {
            console.error("❌ Paratika QueryTransaction Error:", error.response?.data || error.message);
            throw error;
        }
    }
}

export default ParatikaService;
