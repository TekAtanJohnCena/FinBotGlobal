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
     * Generate SHA-512 hash for Paratika requests
     * @param {Object} data - The data to hash
     * @returns {string} - The hex-encoded hash
     */
    static generateHash(data) {
        // Common Paratika/Payten hash fields: MerchantPassword + MerchantId + MerchantPaymentId + Amount + Currency
        const hashString = `${PARATIKA_API_PASSWORD}${PARATIKA_MERCHANT_ID}${data.merchantPaymentId}${data.amount}${data.currency}`;
        return crypto.createHash("sha512").update(hashString).digest("hex");
    }

    /**
     * Initiate a 3D Secure payment session
     * @param {Object} paymentData
     * @returns {Promise<Object>}
     */
    static async initiatePayment(paymentData) {
        try {
            const params = new URLSearchParams();
            params.append("ACTION", "SESSIONTOKEN");
            params.append("SESSIONTYPE", "PAYMENTSESSION");
            params.append("MERCHANT", PARATIKA_MERCHANT_ID);
            params.append("MERCHANTUSER", PARATIKA_API_USER || PARATIKA_MERCHANT_ID);
            params.append("MERCHANTPASSWORD", PARATIKA_API_PASSWORD);
            params.append("MERCHANTPAYMENTID", paymentData.merchantPaymentId);
            params.append("AMOUNT", paymentData.amount);
            params.append("CURRENCY", paymentData.currency || "TRY");
            params.append("RETURNURL", paymentData.returnUrl);

            // Mandatory customer info
            params.append("CUSTOMER", paymentData.cardHolderName);
            params.append("CUSTOMERNAME", paymentData.cardHolderName);
            params.append("CUSTOMEREMAIL", paymentData.email);

            params.append("CUSTOMERIP", paymentData.ip);
            params.append("CUSTOMERUSERAGENT", "Mozilla/5.0 (FinBot)");
            params.append("NAMEONCARD", paymentData.cardHolderName);
            params.append("ECHO", "FinBot-Payment");

            // ORDERITEMS as a JSON string in form-urlencoded
            const orderItems = [
                {
                    name: paymentData.planName,
                    description: paymentData.description,
                    unitPrice: paymentData.amount,
                    quantity: 1
                }
            ];
            params.append("ORDERITEMS", JSON.stringify(orderItems));

            const response = await axios.post(PARATIKA_BASE_URL, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            return response.data;
        } catch (error) {
            console.error("Paratika Initiate Payment Error:", error.response?.data || error.message);
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
            params.append("MERCHANTUSER", PARATIKA_API_USER || PARATIKA_MERCHANT_ID);
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
