import cron from "node-cron";
import PaymentTransaction from "../models/PaymentTransaction.js";
import ParatikaService from "./payment/ParatikaService.js";

/**
 * Cron Job: Check for PENDING transactions every 15 minutes
 * and verify them via Paratika QueryTransaction API.
 */
export const initPaymentCron = () => {
    // Run every 15 minutes
    cron.schedule("*/15 * * * *", async () => {
        console.log("[Cron] Checking for pending Paratika transactions...");

        try {
            // Find transactions created more than 15 mins ago that are still PENDING
            const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

            const pendingTransactions = await PaymentTransaction.find({
                status: "PENDING",
                createdAt: { $lt: fifteenMinsAgo },
                provider: "Paratika"
            });

            console.log(`[Cron] Found ${pendingTransactions.length} pending transactions.`);

            for (const tx of pendingTransactions) {
                try {
                    const result = await ParatikaService.queryTransaction(tx.merchantPaymentId);

                    tx.rawResponse = result;
                    if (result.responseCode === "00") {
                        tx.status = "SUCCESS";
                        tx.isVerified = true;
                        console.log(`[Cron] Transaction ${tx.merchantPaymentId} updated to SUCCESS.`);
                    } else if (result.responseCode && result.responseCode !== "PENDING") {
                        // If it's a definitive failure code from Paratika
                        tx.status = "FAILED";
                        tx.errorMsg = result.responseMsg;
                        console.log(`[Cron] Transaction ${tx.merchantPaymentId} updated to FAILED.`);
                    }

                    await tx.save();
                } catch (txError) {
                    console.error(`[Cron] Error verifying tx ${tx.merchantPaymentId}:`, txError.message);
                }
            }
        } catch (error) {
            console.error("[Cron] Payment verification cron failed:", error);
        }
    });
};
