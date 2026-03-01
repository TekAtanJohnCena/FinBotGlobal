// PATH: backend/src/cron/subscriptionCron.js
/**
 * Subscription Renewal Cron Job
 * 
 * Runs daily at midnight (00:00) to find active subscriptions
 * whose nextBillingDate has arrived and automatically charges
 * the stored card token via Paratika Non-3D sale.
 * 
 * Success → logs PaymentTransaction (SUCCESS), advances nextBillingDate +1 month
 * Failure → logs PaymentTransaction (FAILED), sets subscription to PAST_DUE
 */

import cron from "node-cron";
import Subscription from "../models/Subscription.js";
import User from "../models/userModel.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import ParatikaService from "../services/payment/ParatikaService.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Add exactly 1 month to a given date.
 * Handles month overflow (e.g., Jan 31 → Feb 28).
 * @param {Date} date 
 * @returns {Date}
 */
function addOneMonth(date) {
    const result = new Date(date);
    const currentMonth = result.getMonth();
    result.setMonth(currentMonth + 1);

    // Handle overflow: if month jumped more than 1 (e.g., Jan 31 → Mar 3)
    // roll back to last day of the intended month
    if (result.getMonth() > (currentMonth + 1) % 12) {
        result.setDate(0); // sets to last day of previous month
    }

    return result;
}

/**
 * Process a single subscription renewal.
 * @param {Object} subscription - Mongoose Subscription document (populated with user)
 */
async function processRenewal(subscription) {
    const subId = subscription._id.toString().slice(-6);

    // 1. Get user record to find saved card token
    const user = await User.findById(subscription.user);
    if (!user) {
        console.error(`  ❌ [${subId}] User not found for subscription`);
        subscription.status = "PAST_DUE";
        await subscription.save();
        return;
    }

    // 2. Determine which card token to use
    //    Priority: subscription.activeCardToken → first card in user.savedCards
    let cardToken = subscription.activeCardToken;

    if (!cardToken && user.savedCards?.length > 0) {
        cardToken = user.savedCards[0].cardToken;
    }

    if (!cardToken) {
        console.error(`  ❌ [${subId}] No card token available for subscription user`);
        subscription.status = "PAST_DUE";
        await subscription.save();

        // Log failed transaction
        await PaymentTransaction.create({
            user: user._id,
            merchantPaymentId: `REN-${Date.now()}-${uuidv4().split("-")[0]}`,
            amount: 0,
            currency: "TRY",
            status: "FAILED",
            planType: subscription.planName,
            billingPeriod: "MONTHLY",
            customerInfo: { name: user.firstName || user.username, email: user.email },
            paymentProvider: "Paratika",
            errorMsg: "Kayıtlı kart token bulunamadı"
        });
        return;
    }

    // 3. Get plan amount
    let amount;
    try {
        const plan = await SubscriptionPlan.getByName(subscription.planName);
        if (plan) {
            const monthly = Number(plan.price?.monthly || 0);
            amount = monthly > 1 ? monthly : 0;
        }
    } catch (e) {
        console.error(`  ⚠️ [${subId}] SubscriptionPlan lookup failed:`, e.message);
    }

    // Fallback to hardcoded amounts if plan not found
    if (!amount) {
        const fallbackPrices = { PLUS: 369.00, PRO: 449.00 };
        amount = fallbackPrices[subscription.planName] || 0;
    }

    if (amount <= 0) {
        return;
    }

    // 4. Generate unique payment ID
    const merchantPaymentId = `REN-${Date.now()}-${uuidv4().split("-")[0]}`;

    // 5. Charge via Paratika (Non-3D token sale)
    try {

        const result = await ParatikaService.chargeWithToken({
            cardToken,
            amount: amount.toFixed(2),
            currency: "TRY",
            merchantPaymentId,
            customerId: user.paratikaCustomerId || user._id.toString(),
            customerEmail: user.email,
            customerName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username,
            description: `${subscription.planName} Aylık Abonelik Yenileme`
        });

        // 6. Evaluate Paratika response
        if (result?.responseCode === "00") {
            // ✅ SUCCESS

            // Log successful transaction
            await PaymentTransaction.create({
                user: user._id,
                merchantPaymentId,
                amount,
                currency: "TRY",
                status: "SUCCESS",
                isVerified: true,
                planType: subscription.planName,
                billingPeriod: "MONTHLY",
                customerInfo: { name: user.firstName || user.username, email: user.email },
                paymentProvider: "Paratika",
                paratikaOrderId: result.pgTranId || result.pgOrderId || "",
                rawResponse: result
            });

            // Advance nextBillingDate by 1 month
            const now = new Date();
            const baseDate = subscription.nextBillingDate > now
                ? subscription.nextBillingDate
                : now;
            subscription.nextBillingDate = addOneMonth(baseDate);
            subscription.currentPeriodStart = now;
            subscription.currentPeriodEnd = subscription.nextBillingDate;
            subscription.status = "ACTIVE";
            await subscription.save();

            // Ensure user subscription fields are in sync
            user.subscriptionTier = subscription.planName;
            user.subscriptionStatus = "ACTIVE";
            await user.save();

        } else {
            // ❌ FAILED
            const errorMsg = result?.responseMsg || "Bilinmeyen ödeme hatası";
            console.error(`  ❌ [${subId}] Payment FAILED: ${errorMsg}`);

            await PaymentTransaction.create({
                user: user._id,
                merchantPaymentId,
                amount,
                currency: "TRY",
                status: "FAILED",
                planType: subscription.planName,
                billingPeriod: "MONTHLY",
                customerInfo: { name: user.firstName || user.username, email: user.email },
                paymentProvider: "Paratika",
                paratikaOrderId: result?.pgTranId || result?.pgOrderId || "",
                errorMsg,
                rawResponse: result
            });

            subscription.status = "PAST_DUE";
            await subscription.save();
        }
    } catch (error) {
        console.error(`  ❌ [${subId}] Paratika API error:`, error.message);

        await PaymentTransaction.create({
            user: user._id,
            merchantPaymentId,
            amount,
            currency: "TRY",
            status: "FAILED",
            planType: subscription.planName,
            billingPeriod: "MONTHLY",
            customerInfo: { name: user.firstName || user.username, email: user.email },
            paymentProvider: "Paratika",
            errorMsg: `API Hatası: ${error.message}`
        });

        subscription.status = "PAST_DUE";
        await subscription.save();
    }
}

/**
 * Initialize the subscription renewal cron job.
 * Runs every day at midnight (00:00 UTC).
 */
export const initSubscriptionCron = () => {
    // Run daily at 00:00
    cron.schedule("0 0 * * *", async () => {

        try {
            // Find ACTIVE subscriptions where nextBillingDate <= now
            const now = new Date();
            const dueSubscriptions = await Subscription.find({
                status: "ACTIVE",
                nextBillingDate: { $lte: now },
                activeCardToken: { $exists: true, $ne: null }
            });


            if (dueSubscriptions.length === 0) {
                return;
            }

            let successCount = 0;
            let failCount = 0;

            for (const sub of dueSubscriptions) {
                try {
                    await processRenewal(sub);
                    if (sub.status === "ACTIVE") successCount++;
                    else failCount++;
                } catch (err) {
                    failCount++;
                    console.error(`  ❌ [SubscriptionCron] Unexpected error for sub ${sub._id}:`, err.message);
                }

                // Small delay between charges to avoid overwhelming Paratika
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

        } catch (error) {
            console.error("❌ [SubscriptionCron] Cron job failed:", error);
        }
    });

};
