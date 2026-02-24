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
 */
class ParatikaService {
    /**
     * Format any number or string to a "X.XX" string as required by Paratika.
     * Removes commas and ensures exactly 2 decimal places.
     * @param {any} val
     * @returns {string}
     */
    static formatAmount(val) {
        if (typeof val === "string") {
            // Use global regex to replace all commas
            val = val.replace(/,/g, ".");
        }
        const num = parseFloat(val);
        if (isNaN(num)) return "0.00";
        return num.toFixed(2);
    }

    /**
     * Generate SHA-512 hash for Paratika requests following the V2 sequence:
     * MerchantID + MerchantPaymentID + Amount + ReturnURL + MerchantUser + MerchantPassword + Salt
     * @param {Object} data - The data to hash
     * @returns {string} - The hex-encoded hash
     */
    static generateHash(data) {
        const formattedAmount = this.formatAmount(data.amount);
        const salt = process.env.PARATIKA_SALT || "";

        // Final check on order: MerchantID + MerchantPaymentID + Amount + ReturnURL + MerchantUser + MerchantPassword + Salt
        const hashString = `${PARATIKA_MERCHANT_ID}${data.merchantPaymentId}${formattedAmount}${data.returnUrl}${FINAL_MERCHANT_USER}${PARATIKA_API_PASSWORD}${salt}`;

        console.log("-----------------------------------------");
        console.log("🔍 PARATIKA HASH DEBUG");
        console.log("String:", `${PARATIKA_MERCHANT_ID}${data.merchantPaymentId}${formattedAmount}${data.returnUrl}${FINAL_MERCHANT_USER}***${salt}`);
        console.log("-----------------------------------------");

        return crypto.createHash("sha512").update(hashString).digest("hex");
    }

    /**
     * Initiate a 3D Secure payment session
     * @param {Object} paymentData
     * @returns {Promise<Object>}
     */
    static async initiatePayment(paymentData) {
        try {
            const formattedTotalAmount = this.formatAmount(paymentData.amount);

            const params = new URLSearchParams();
            params.append("ACTION", "SESSIONTOKEN");
            params.append("SESSIONTYPE", "PAYMENTSESSION");
            params.append("MERCHANT", PARATIKA_MERCHANT_ID);
            params.append("MERCHANTUSER", FINAL_MERCHANT_USER);
            params.append("MERCHANTPASSWORD", PARATIKA_API_PASSWORD);
            params.append("MERCHANTPAYMENTID", paymentData.merchantPaymentId);
            params.append("ORDERID", paymentData.merchantPaymentId); // Often used as an alias for MERCHANTPAYMENTID
            params.append("AMOUNT", formattedTotalAmount);
            params.append("CURRENCY", (paymentData.currency || "TRY").toUpperCase());

            // Return URLs
            params.append("RETURNURL", paymentData.returnUrl);
            params.append("RETURN_URL", paymentData.returnUrl); // Compatibility

            // Add SIGNATURE (Hash) following user provided sequence
            const signature = this.generateHash({
                merchantPaymentId: paymentData.merchantPaymentId,
                amount: formattedTotalAmount,
                returnUrl: paymentData.returnUrl
            });
            params.append("SIGNATURE", signature);

            // CUSTOMER Params to fix ERR10010
            params.append("CUSTOMER", paymentData.email || "guest_user");
            params.append("CUSTOMERNAME", paymentData.cardHolderName || "Test");
            params.append("CUSTOMERSURNAME", paymentData.surname || "Customer");
            params.append("CUSTOMEREMAIL", paymentData.email || "test@finbot.com.tr");
            params.append("CUSTOMERPHONE", paymentData.phone || "05555555555");

            // Normalize IP
            let ip = paymentData.ip || "127.0.0.1";
            if (ip === "::1" || ip === "localhost") ip = "127.0.0.1";
            if (ip.includes(',')) ip = ip.split(',')[0].trim(); // Handle comma-separated x-forwarded-for

            params.append("CUSTOMERIP", ip);
            params.append("CUSTOMERUSERAGENT", paymentData.userAgent || "Mozilla/5.0 (FinBot)");
            params.append("NAMEONCARD", paymentData.cardHolderName);
            params.append("ECHO", "FinBot-POS");

            // ORDERITEMS
            const rawItems = paymentData.items || [
                {
                    name: paymentData.planName || "Subscription",
                    description: paymentData.description || "Plan Access",
                    unitPrice: paymentData.amount,
                    quantity: 1
                }
            ];

            const orderItems = rawItems.map(item => {
                const upFormatted = this.formatAmount(item.unitPrice);
                const qty = (parseInt(item.quantity) || 1).toString();
                const total = (parseFloat(upFormatted) * parseInt(qty)).toFixed(2);

                return {
                    name: item.name,
                    description: item.description,
                    unitPrice: upFormatted,
                    quantity: qty,
                    amount: total
                };
            });

            // Mathematical Validation
            const itemsSum = orderItems.reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2);

            if (itemsSum !== formattedTotalAmount) {
                console.error(`Paratika Validation Error: Items sum (${itemsSum}) != Total (${formattedTotalAmount})`);
                throw new Error(`Payment amount validation failed: Item sum ${itemsSum} does not match total ${formattedTotalAmount}`);
            }

            params.append("ORDERITEMS", JSON.stringify(orderItems));

            console.log("🚀 SENDING PARATIKA REQUEST:");
            for (const [k, v] of params.entries()) {
                if (!k.includes("PASSWORD")) console.log(`   ${k}: ${v}`);
            }

            const response = await axios.post(PARATIKA_BASE_URL, params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 10000
            });

            console.log("✅ PARATIKA RESPONSE STATUS:", response.status);
            console.log("✅ PARATIKA RESPONSE DATA:", JSON.stringify(response.data, null, 2));

            // CRITICAL: Double check sessionToken existence even if code is 00
            if (response.data.responseCode === "00" && !response.data.sessionToken) {
                console.error("❌ Paratika returned 00 but NO sessionToken. Possible redirect error.");
                return {
                    ...response.data,
                    responseCode: "ERR_NO_TOKEN",
                    responseMsg: "Session token could not be generated. Please check merchant settings."
                };
            }

            return response.data;
        } catch (error) {
            if (error.response) {
                console.error("❌ Paratika API Error Response:", error.response.status);
                console.error("❌ Data:", error.response.data);
            } else {
                console.error("❌ Paratika Connection Error:", error.message);
            }
            throw error;
        }
    }

    /**
     * Query transaction status using MERCHANTPAYMENTID
     * @param {string} merchantPaymentId
     * @returns {Promise<Object>}
     */
    static async queryTransaction(merchantPaymentId) {
        try {
            const params = new URLSearchParams();
            params.append("ACTION", "QUERYPAYMENT");
            params.append("MERCHANT", PARATIKA_MERCHANT_ID);
            params.append("MERCHANTUSER", FINAL_MERCHANT_USER);
            params.append("MERCHANTPASSWORD", PARATIKA_API_PASSWORD);
            params.append("MERCHANTPAYMENTID", merchantPaymentId);

            const response = await axios.get(PARATIKA_BASE_URL, { params });

            return response.data;
        } catch (error) {
            console.error("Paratika Query Transaction Error:", error.response?.data || error.message);
            throw error;
        }
    }
}

export default ParatikaService;
