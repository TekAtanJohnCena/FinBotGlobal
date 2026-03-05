import ParatikaService from "../services/payment/ParatikaService.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import User from "../models/userModel.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import PromoCode from "../models/PromoCode.js";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

/**
 * Fallback live prices (TRY)
 */
const TEST_PLAN_FALLBACK = {
    PLUS: { monthly: 369.00, yearly: 369.00, label: "Plus" },
    PRO: { monthly: 449.00, yearly: 449.00, label: "Pro" }
};

async function resolvePlanPricing(planType, billingPeriod = "MONTHLY") {
    const normalizedPlanType = String(planType || "").toUpperCase();
    if (!["PLUS", "PRO"].includes(normalizedPlanType)) {
        throw new Error("invalid_plan");
    }

    const normalizedBilling = billingPeriod === "YEARLY" ? "YEARLY" : "MONTHLY";
    const dbPlan = await SubscriptionPlan.getByName(normalizedPlanType);

    if (dbPlan?.price) {
        const monthly = Number(dbPlan.price.monthly ?? 0);
        const yearly = Number(dbPlan.price.yearly ?? monthly);
        const dbAmount = normalizedBilling === "YEARLY" ? yearly : monthly;
        const isLegacyTestAmount = Number.isFinite(dbAmount) && Number(dbAmount.toFixed(2)) === 1.00;

        if (Number.isFinite(dbAmount) && dbAmount > 0 && !isLegacyTestAmount) {
            console.log(`[Payment] Pricing source=DB | plan=${normalizedPlanType} | billing=${normalizedBilling} | amount_try=${dbAmount.toFixed(2)}`);
            return {
                planType: normalizedPlanType,
                billingPeriod: normalizedBilling,
                amount: Number(dbAmount.toFixed(2)),
                label: dbPlan.displayNameTR || dbPlan.displayName || normalizedPlanType
            };
        }

        if (isLegacyTestAmount) {
            console.warn(`[Payment] Legacy DB test price detected (1.00) for ${normalizedPlanType}/${normalizedBilling}. Falling back to live pricing.`);
        }
    }

    const fallback = TEST_PLAN_FALLBACK[normalizedPlanType];
    if (!fallback) {
        throw new Error("invalid_plan");
    }

    const fallbackAmount = normalizedBilling === "YEARLY" ? fallback.yearly : fallback.monthly;
    console.log(`[Payment] Pricing source=FALLBACK | plan=${normalizedPlanType} | billing=${normalizedBilling} | amount_try=${fallbackAmount.toFixed(2)}`);
    return {
        planType: normalizedPlanType,
        billingPeriod: normalizedBilling,
        amount: Number(fallbackAmount.toFixed(2)),
        label: fallback.label
    };
}

function parseAmount(value) {
    if (value === null || value === undefined || value === "") return null;

    if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
    }

    const normalized = String(value)
        .replace(/[^\d,.-]/g, "")
        .replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
}

function extractAmountCandidate(payload) {
    if (!payload || typeof payload !== "object") return null;
    const amountKeys = [
        "amount",
        "AMOUNT",
        "transactionAmount",
        "TRANSACTIONAMOUNT",
        "paidAmount",
        "PAIDAMOUNT",
        "totalAmount",
        "TOTALAMOUNT"
    ];

    for (const key of amountKeys) {
        const parsed = parseAmount(payload[key]);
        if (parsed !== null) return parsed;
    }

    return null;
}

function isAmountMatch(expected, actual, tolerance = 0.01) {
    if (!Number.isFinite(expected) || !Number.isFinite(actual)) return false;
    return Math.abs(expected - actual) <= tolerance;
}

function normalizePaidAmountToTry(expectedAmount, rawPaidAmount) {
    if (!Number.isFinite(rawPaidAmount)) return null;

    const candidates = [rawPaidAmount, rawPaidAmount / 100];
    for (const candidate of candidates) {
        if (isAmountMatch(expectedAmount, candidate)) {
            return candidate;
        }
    }

    return rawPaidAmount;
}

/**
 * Get frontend URL with protocol safety
 * Prefers CLIENT_URL (production domain) over FRONTEND_URL (dev localhost)
 */
function getFrontendUrl() {
    let url = process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:3000";
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
    }
    return url.replace(/\/+$/, '');
}

function normalizeHash(value) {
    return String(value || "")
        .trim()
        .replace(/\s+/g, "")
        .toUpperCase();
}

function safeHashCompare(left, right) {
    if (!left || !right) return false;
    if (left.length !== right.length) return false;
    return crypto.timingSafeEqual(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function getIncomingCallbackHash(payload) {
    const possibleHashKeys = [
        "hash",
        "HASH",
        "hashData",
        "HASHDATA",
        "signature",
        "SIGNATURE",
        "secureHash",
        "SECUREHASH"
    ];

    for (const key of possibleHashKeys) {
        if (payload[key]) {
            return String(payload[key]);
        }
    }

    return null;
}

function buildHashPayload(payload) {
    const hashParamsVal = payload.hashParamsVal || payload.HASHPARAMSVAL;
    if (hashParamsVal) {
        return String(hashParamsVal);
    }

    const hashParams = payload.hashParams || payload.HASHPARAMS;
    if (hashParams) {
        return String(hashParams)
            .split(":")
            .filter(Boolean)
            .map((fieldName) => String(payload[fieldName] ?? payload[fieldName.toUpperCase()] ?? ""))
            .join("");
    }

    const excludedKeys = new Set(["hash", "HASH", "hashData", "HASHDATA", "signature", "SIGNATURE", "secureHash", "SECUREHASH"]);
    return Object.keys(payload)
        .filter((key) => !excludedKeys.has(key))
        .sort()
        .map((key) => `${key}=${String(payload[key] ?? "")}`)
        .join("&");
}

function calculateExpectedHashes(payloadString, secretKey) {
    const candidates = new Set();

    candidates.add(crypto.createHmac("sha256", secretKey).update(payloadString, "utf8").digest("hex"));
    candidates.add(crypto.createHmac("sha256", secretKey).update(payloadString, "utf8").digest("base64"));
    candidates.add(crypto.createHmac("sha512", secretKey).update(payloadString, "utf8").digest("hex"));
    candidates.add(crypto.createHmac("sha512", secretKey).update(payloadString, "utf8").digest("base64"));
    candidates.add(crypto.createHash("sha256").update(`${payloadString}${secretKey}`, "utf8").digest("hex"));
    candidates.add(crypto.createHash("sha512").update(`${payloadString}${secretKey}`, "utf8").digest("hex"));

    return [...candidates].map(normalizeHash);
}

function validateParatikaCallbackSignature(payload) {
    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) {
        return { valid: false, reason: "missing_secret" };
    }

    const incomingHash = getIncomingCallbackHash(payload);
    if (!incomingHash) {
        return { valid: false, reason: "missing_signature" };
    }

    const payloadString = buildHashPayload(payload);
    const expectedHashes = calculateExpectedHashes(payloadString, secretKey);
    const normalizedIncomingHash = normalizeHash(incomingHash);

    const valid = expectedHashes.some((expectedHash) => safeHashCompare(normalizedIncomingHash, expectedHash));
    return { valid, reason: valid ? null : "signature_mismatch" };
}

/**
 * Create a new payment session (Direct POST 3D model)
 * Backend only creates sessionToken — card data handled client-side
 */
export const createPayment = async (req, res) => {
    try {

        const { planType, billingPeriod, promoCode } = req.body;
        const userId = req.user?.id;
        const userEmail = req.user?.email;
        const userName = req.user?.firstName || "FinBot User";
        const normalizedPlanType = String(planType || "").toUpperCase();
        const normalizedBillingPeriod = billingPeriod === "YEARLY" ? "YEARLY" : "MONTHLY";

        if (!planType || !normalizedPlanType) {
            return res.status(400).json({ success: false, message: "Gecersiz plan secimi." });
        }

        let planPricing;
        try {
            planPricing = await resolvePlanPricing(normalizedPlanType, normalizedBillingPeriod);
        } catch {
            return res.status(400).json({ success: false, message: "Gecersiz plan secimi." });
        }

        let amount = planPricing.amount;
        let appliedPromoCodeId = null;
        let discountAmount = 0;

        // Promosyon Kodu Uygulama
        if (promoCode) {
            const promo = await PromoCode.findOne({ code: promoCode.trim().toUpperCase() });
            if (!promo || !promo.isValid()) {
                return res.status(400).json({ success: false, message: "Geçersiz veya süresi dolmuş promosyon kodu." });
            }

            discountAmount = (amount * promo.discountPercent) / 100;
            amount = Math.max(0, amount - discountAmount); // Ensure amount doesn't go below 0
            appliedPromoCodeId = promo._id;
            console.log(`[Payment] Promo applied: ${promo.code} (-${promo.discountPercent}%) -> New amount: ${amount}`);
        }

        const formattedAmount = ParatikaService.formatAmount(amount.toFixed(2));
        console.log(`[Payment] createPayment | plan=${planPricing.planType} | billing=${planPricing.billingPeriod} | amount_try=${amount.toFixed(2)} | formatted=${formattedAmount}`);

        const merchantPaymentId = `FIN-${Date.now()}-${uuidv4().split('-')[0]}`;

        // 1. Create transaction record in DB
        const transaction = await PaymentTransaction.create({
            user: userId,
            merchantPaymentId,
            amount,
            currency: "TRY",
            status: "PENDING",
            planType: planPricing.planType,
            billingPeriod: planPricing.billingPeriod,
            customerInfo: {
                name: userName,
                email: userEmail
            },
            promoCode: appliedPromoCodeId,
            discountAmount: discountAmount
        });

        // 2. Call Paratika to create session token
        // Build callback URL dynamically - use request origin for correct URL in both dev and production
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.headers['host'] || 'localhost:5000';
        const backendUrl = process.env.BACKEND_URL && process.env.BACKEND_URL !== 'http://localhost:5000'
            ? process.env.BACKEND_URL
            : `${protocol}://${host}`;
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
            planName: planPricing.billingPeriod === "YEARLY" ? `${planPricing.label} (Yillik)` : planPricing.label,
            description: planPricing.billingPeriod === "YEARLY"
                ? `Yillik ${planPricing.label} Aboneligi`
                : `Aylik ${planPricing.label} Aboneligi`
        });


        // 3. Handle response
        if (result && result.sessionToken) {
            transaction.sessionToken = result.sessionToken;
            transaction.rawResponse = result;
            await transaction.save();

            // Direct POST 3D: Frontend will POST card data directly to this URL
            const redirectUrl = `https://vpos.paratika.com.tr/paratika/api/v2/post/sale3d/${result.sessionToken}`;

            return res.status(200).json({
                success: true,
                redirectUrl,
                sessionToken: result.sessionToken
            });
        } else {
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
        const frontendUrl = getFrontendUrl(); // callback redirect target

        // ========= FULL DEBUG LOGGING =========
        console.log("═══════════════════════════════════════════");
        console.log(`[Payment Callback] ${req.method} received at ${new Date().toISOString()}`);
        console.log("[Payment Callback] Headers:", JSON.stringify({
            'content-type': req.headers['content-type'],
            'user-agent': req.headers['user-agent']?.substring(0, 50),
            origin: req.headers['origin'],
            referer: req.headers['referer']
        }, null, 2));

        // Log ALL callback data (mask sensitive fields)
        const safeData = { ...data };
        if (safeData.hash) safeData.hash = safeData.hash.substring(0, 10) + "...";
        if (safeData.HASH) safeData.HASH = safeData.HASH.substring(0, 10) + "...";
        if (safeData.hashData) safeData.hashData = safeData.hashData.substring(0, 10) + "...";
        if (safeData.HASHDATA) safeData.HASHDATA = safeData.HASHDATA.substring(0, 10) + "...";
        console.log("[Payment Callback] Full payload:", JSON.stringify(safeData, null, 2));
        console.log("[Payment Callback] All keys:", Object.keys(data).join(", "));
        console.log("═══════════════════════════════════════════");

        // Paratika may use various field name formats — check all
        const merchantPaymentId = data.merchantPaymentId || data.MERCHANTPAYMENTID
            || data.MerchantPaymentId || data.pgOrderId || data.PGORDERID;
        const responseCode = data.responseCode || data.RESPONSECODE || data.ResponseCode;
        const responseMsg = data.responseMsg || data.RESPONSEMSG || data.ResponseMsg;
        const sessionToken = data.sessionToken || data.SESSIONTOKEN;

        console.log("[Payment Callback] Extracted fields:", {
            merchantPaymentId,
            responseCode,
            responseMsg,
            sessionToken: sessionToken ? sessionToken.substring(0, 15) + "..." : "N/A"
        });

        if (!merchantPaymentId) {
            console.error("❌ Callback: Missing merchantPaymentId. All keys:", Object.keys(data));
            console.error("❌ Full data dump:", JSON.stringify(data, null, 2));
            return res.redirect(`${frontendUrl}/payment-status?status=failed&error=missing_id`);
        }


        // Find transaction in DB
        let transaction = await PaymentTransaction.findOne({ merchantPaymentId });

        // Fallback: try finding by sessionToken
        if (!transaction && sessionToken) {
            transaction = await PaymentTransaction.findOne({ sessionToken });
            if (transaction) {
                console.log(`[Payment Callback] Found transaction via sessionToken fallback: ${transaction.merchantPaymentId}`);
            }
        }

        if (!transaction) {
            console.error("❌ Transaction not found:", merchantPaymentId);
            return res.redirect(`${frontendUrl}/payment-status?status=failed&error=not_found&id=${merchantPaymentId}`);
        }

        console.log(`[Payment Callback] Transaction found: ${transaction.merchantPaymentId}, current status: ${transaction.status}, amount: ${transaction.amount}`);

        // Verify with QUERYTRANSACTION (double-check with Paratika)
        let verified = false;
        let queryResult = null;
        let approvedTx = null;
        try {
            queryResult = await ParatikaService.queryTransaction(transaction.merchantPaymentId);
            transaction.rawResponse = queryResult;

            console.log("[Payment Callback] QUERYTRANSACTION result:", {
                responseCode: queryResult.responseCode,
                responseMsg: queryResult.responseMsg,
                transactionCount: queryResult.transactionList?.length || 0,
                transactions: (queryResult.transactionList || []).map(t => ({
                    pgTranId: t.pgTranId,
                    status: t.transactionStatus,
                    amount: t.amount || t.AMOUNT
                }))
            });

            if (queryResult.responseCode === "00") {
                const txList = queryResult.transactionList || [];
                approvedTx = txList.find(tx => tx.transactionStatus === "AP");

                if (approvedTx) {
                    verified = true;
                    transaction.status = "SUCCESS";
                    transaction.isVerified = true;
                    console.log("[Payment Callback] ✅ APPROVED transaction found:", approvedTx.pgTranId);
                } else if (txList.length === 0 && responseCode === "00") {
                    // No transactionList yet but Paratika callback says 00
                    verified = true;
                    transaction.status = "SUCCESS";
                    transaction.isVerified = true;
                    console.log("[Payment Callback] ✅ Callback responseCode=00, no txList yet");
                } else {
                    const statuses = txList.map(t => `${t.pgTranId || 'N/A'}: ${t.transactionStatus}`);
                    console.error("[Payment Callback] ❌ No AP transaction. Statuses:", statuses);
                    transaction.status = "FAILED";
                    transaction.errorMsg = "İşlem doğrulanamadı";
                }
            } else {
                console.error("[Payment Callback] ❌ QUERYTRANSACTION failed:", queryResult.responseCode, queryResult.responseMsg);
                transaction.status = "FAILED";
                transaction.errorMsg = queryResult.responseMsg || "İşlem başarısız";
            }
        } catch (queryError) {
            console.error("❌ QUERYTRANSACTION error:", queryError.message);
            // Fall back to callback responseCode
            if (responseCode === "00") {
                verified = true;
                transaction.status = "SUCCESS";
                transaction.isVerified = false; // Not fully verified
                console.log("[Payment Callback] ⚠️ Using callback responseCode as fallback");
            } else {
                transaction.status = "FAILED";
                transaction.errorMsg = `Doğrulama hatası: ${responseCode}`;
            }
        }

        if (verified) {
            const expectedAmount = parseAmount(transaction.amount);
            const rawPaidAmount =
                extractAmountCandidate(approvedTx) ??
                extractAmountCandidate(queryResult) ??
                extractAmountCandidate(data);
            const paidAmount = normalizePaidAmountToTry(expectedAmount, rawPaidAmount);

            console.log("[Payment Callback] Amount check:", { expectedAmount, rawPaidAmount, paidAmount });

            if (expectedAmount !== null && paidAmount !== null && !isAmountMatch(expectedAmount, paidAmount)) {
                verified = false;
                transaction.status = "FAILED";
                transaction.isVerified = false;
                transaction.errorMsg = `Tutar uyumsuz: beklenen ${expectedAmount.toFixed(2)} TRY, gelen ${rawPaidAmount.toFixed(2)} (ham)`;
                console.error("[Payment Callback] ❌ Amount mismatch!", transaction.errorMsg);
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
                    console.log(`[Payment Callback] ✅ User ${user.email} upgraded to ${transaction.planType}`);

                    // Create/Update Subscription record for auto-renewal cron
                    try {
                        const Subscription = (await import("../models/Subscription.js")).default;
                        const now = new Date();
                        const nextBilling = new Date(now);
                        nextBilling.setDate(nextBilling.getDate() + 30);

                        let subscription = await Subscription.findOne({ user: user._id });
                        if (subscription) {
                            subscription.planName = transaction.planType;
                            subscription.status = "ACTIVE";
                            subscription.currentPeriodStart = now;
                            subscription.currentPeriodEnd = nextBilling;
                            subscription.nextBillingDate = nextBilling;
                            subscription.cancelAtPeriodEnd = false;
                            await subscription.save();
                        } else {
                            await Subscription.create({
                                user: user._id,
                                planName: transaction.planType,
                                status: "ACTIVE",
                                currentPeriodStart: now,
                                currentPeriodEnd: nextBilling,
                                nextBillingDate: nextBilling,
                                paymentProvider: "Paratika",
                                cancelAtPeriodEnd: false
                            });
                        }
                        console.log(`[Payment Callback] ✅ Subscription record updated, next billing: ${nextBilling.toISOString()}`);
                    } catch (subErr) {
                        console.error("[Payment Callback] ⚠️ Subscription record update failed:", subErr.message);
                        // Non-critical: payment still succeeded
                    }
                }
            } catch (updateError) {
                console.error("❌ User subscription update error:", updateError.message);
                // Payment still succeeded, don't fail the redirect
            }

            // Eğer promosyon kodu kullanıldıysa sayısını artır
            if (transaction.promoCode) {
                try {
                    await PromoCode.findByIdAndUpdate(transaction.promoCode, { $inc: { currentUses: 1 } });
                    console.log(`[Payment Callback] ✅ PromoCode usage incremented for tx: ${transaction.merchantPaymentId}`);
                } catch (e) {
                    console.error("[Payment Callback] ⚠️ Failed to increment promoCode uses:", e);
                }
            }
        }

        // Redirect user to frontend payment status page
        const status = transaction.status === "SUCCESS" ? "success" : "failed";
        const redirectUrl = `${frontendUrl}/payment-status?status=${status}&id=${transaction.merchantPaymentId}`;
        console.log(`[Payment Callback] Redirecting to: ${redirectUrl}`);
        console.log("═══════════════════════════════════════════");
        res.redirect(redirectUrl);

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
}

/**
 * Validate Promo Code
 */
export const validatePromoCode = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ success: false, message: "Promosyon kodu girilmedi." });
        }

        const promo = await PromoCode.findOne({ code: code.trim().toUpperCase() });
        if (!promo) {
            return res.status(404).json({ success: false, message: "Geçersiz promosyon kodu." });
        }

        if (!promo.isValid()) {
            return res.status(400).json({ success: false, message: "Bu kodun kullanım süresi dolmuş veya limiti aşılmış." });
        }

        res.status(200).json({
            success: true,
            discountPercent: promo.discountPercent,
            message: "Promosyon kodu başarıyla uygulandı."
        });
    } catch (error) {
        console.error("Validate Promo Error:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası." });
    }
};;

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
        }
    } catch (err) {
        console.error("❌ upgradeUserSubscription error:", err.message);
    }
}
