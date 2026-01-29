// Debug script to check user tier and quota
import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/userModel.js";

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected\n");

        const user = await User.findOne({ email: "ercanemre1108@gmail.com" });

        if (!user) {
            console.log("❌ User not found");
            process.exit(1);
        }

        console.log("📋 User Details:");
        console.log("   Email:", user.email);
        console.log("   subscriptionTier (raw):", JSON.stringify(user.subscriptionTier));
        console.log("   subscriptionTier (charCodes):", [...(user.subscriptionTier || "")].map(c => c.charCodeAt(0)));
        console.log("   subscriptionStatus:", user.subscriptionStatus);
        console.log("   usage:", JSON.stringify(user.usage, null, 2));

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

checkUser();
