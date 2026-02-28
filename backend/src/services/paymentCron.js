import cron from "node-cron";
import PaymentTransaction from "../models/PaymentTransaction.js";
import ParatikaService from "./payment/ParatikaService.js";
import User from "../models/userModel.js";

/**
 * Cron Job: Check for PENDING transactions every 15 minutes
 * and verify them via Paratika QueryTransaction API.
 * 
 * This catches cases where:
 * - User closes browser before callback
 * - Callback fails for any reason
 * - Network issues during redirect
 */
export const initPaymentCron = () => {
    // Run every 15 minutes
    cron.schedule("*/15 * * * *", async () => {

        try {
            // Find transactions created more than 5 mins ago that are still PENDING
            const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);

            const pendingTransactions = await PaymentTransaction.find({
                status: "PENDING",
                createdAt: { $lt: fiveMinsAgo },
                paymentProvider: "Paratika"  // Fixed: was 'provider' which is wrong field name
            });


            for (const tx of pendingTransactions) {
                try {
                    const result = await ParatikaService.queryTransaction(tx.merchantPaymentId);

                    tx.rawResponse = result;

                    if (result.responseCode === "00") {
                        const txList = result.transactionList || [];
                        const approvedTx = txList.find(t => t.transactionStatus === "AP");

                        if (approvedTx) {
                            tx.status = "SUCCESS";
                            tx.isVerified = true;
                            await tx.save();

                            // Upgrade user subscription
                            try {
                                const user = await User.findById(tx.user);
                                if (user) {
                                    user.subscriptionTier = tx.planType;
                                    user.subscriptionStatus = "ACTIVE";
                                    await user.save();
                                }
                            } catch (userErr) {
                                console.error(`[Cron] User upgrade error:`, userErr.message);
                            }
                        } else {
                            // Check if all transactions have failed status
                            const allFailed = txList.length > 0 && txList.every(t => t.transactionStatus === "FA");
                            if (allFailed) {
                                tx.status = "FAILED";
                                tx.errorMsg = "3D Secure doğrulaması başarısız";
                                await tx.save();
                            }
                        }
                    } else if (result.responseCode && result.responseCode !== "00") {
                        // Definitive failure from Paratika
                        tx.status = "FAILED";
                        tx.errorMsg = result.responseMsg;
                        await tx.save();
                    }
                } catch (txError) {
                    console.error(`[Cron] Error verifying tx ${tx.merchantPaymentId}:`, txError.message);
                }
            }
        } catch (error) {
            console.error("[Cron] Payment verification cron failed:", error);
        }
    });
};
