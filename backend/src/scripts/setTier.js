// Script to change user tier for testing
// Usage: node src/scripts/setTier.js <email> <tier>
// Example: node src/scripts/setTier.js test@example.com FREE

import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/userModel.js";

async function setTier() {
    const email = process.argv[2];
    const tier = process.argv[3]?.toUpperCase();

    if (!email || !tier) {
        console.log("Usage: node src/scripts/setTier.js <email> <tier>");
        console.log("Tiers: FREE, PLUS, PRO");
        console.log("Example: node src/scripts/setTier.js test@example.com FREE");
        process.exit(1);
    }

    if (!["FREE", "PLUS", "PRO"].includes(tier)) {
        console.log("❌ Invalid tier. Use: FREE, PLUS, or PRO");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected\n");

        const result = await User.updateOne(
            { email: email.toLowerCase() },
            { $set: { subscriptionTier: tier } }
        );

        if (result.matchedCount === 0) {
            console.log(`❌ User not found: ${email}`);
        } else if (result.modifiedCount > 0) {
            console.log(`✅ ${email} tier changed to: ${tier}`);
        } else {
            console.log(`ℹ️ User already on ${tier} tier`);
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

setTier();
