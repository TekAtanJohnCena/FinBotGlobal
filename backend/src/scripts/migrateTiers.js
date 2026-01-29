// PATH: backend/src/scripts/migrateTiers.js
/**
 * Database Migration - Tier Names
 * 
 * Migrates users from old tier names (BASIC/PREMIUM) to new names (PLUS/PRO).
 * Run this script once after deploying the new subscription system.
 * 
 * Usage: node src/scripts/migrateTiers.js
 * 
 * @module scripts/migrateTiers
 */

import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/userModel.js";

const TIER_MIGRATIONS = [
    { from: "BASIC", to: "PLUS" },
    { from: "PREMIUM", to: "PRO" }
];

async function migrateTiers() {
    try {
        console.log("🔄 Starting tier name migration...\n");

        const MONGO_URI = process.env.MONGO_URI;
        if (!MONGO_URI) {
            throw new Error("MONGO_URI is not defined in .env");
        }

        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB\n");

        let totalMigrated = 0;

        for (const { from, to } of TIER_MIGRATIONS) {
            console.log(`📋 Migrating ${from} → ${to}...`);

            const result = await User.updateMany(
                { subscriptionTier: from },
                { $set: { subscriptionTier: to } }
            );

            console.log(`   ✅ Migrated ${result.modifiedCount} users from ${from} to ${to}`);
            totalMigrated += result.modifiedCount;
        }

        console.log(`\n🎉 Migration completed! Total users migrated: ${totalMigrated}`);

        // Summary
        console.log("\n📊 Current tier distribution:");
        const freeCount = await User.countDocuments({ subscriptionTier: "FREE" });
        const plusCount = await User.countDocuments({ subscriptionTier: "PLUS" });
        const proCount = await User.countDocuments({ subscriptionTier: "PRO" });

        console.log(`   FREE: ${freeCount} users`);
        console.log(`   PLUS: ${plusCount} users`);
        console.log(`   PRO:  ${proCount} users`);

    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log("\n👋 MongoDB connection closed");
        process.exit(0);
    }
}

// Run if executed directly
migrateTiers();
