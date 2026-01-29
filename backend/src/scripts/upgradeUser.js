// PATH: backend/src/scripts/upgradeUser.js
/**
 * Upgrade a user to PRO tier
 * 
 * Usage: node src/scripts/upgradeUser.js <email>
 * Example: node src/scripts/upgradeUser.js test@example.com
 */

import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/userModel.js";

async function upgradeUser() {
    const email = process.argv[2];

    if (!email) {
        console.log("Usage: node src/scripts/upgradeUser.js <email>");
        console.log("Example: node src/scripts/upgradeUser.js test@example.com");
        process.exit(1);
    }

    try {
        console.log("🔄 Connecting to MongoDB...");

        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected\n");

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.log(`❌ User not found: ${email}`);
            process.exit(1);
        }

        console.log(`📋 Found user: ${user.email}`);
        console.log(`   Current tier: ${user.subscriptionTier}`);
        console.log(`   Current status: ${user.subscriptionStatus}\n`);

        // Use updateOne to bypass validation (user may have missing required fields)
        const result = await User.updateOne(
            { _id: user._id },
            { $set: { subscriptionTier: "PRO", subscriptionStatus: "ACTIVE" } }
        );

        if (result.modifiedCount > 0) {
            console.log(`🚀 Successfully upgraded to PRO!`);
        } else {
            console.log(`⚠️ No changes made`);
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

upgradeUser();
