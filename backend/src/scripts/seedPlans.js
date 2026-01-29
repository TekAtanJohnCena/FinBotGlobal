// PATH: backend/src/scripts/seedPlans.js
/**
 * Database Seeder - Subscription Plans
 * 
 * Seeds the three subscription plans into MongoDB.
 * Run this script after setting up the database to initialize plans.
 * 
 * Usage: node src/scripts/seedPlans.js
 * 
 * @module scripts/seedPlans
 */

import "dotenv/config";
import mongoose from "mongoose";
import SubscriptionPlan from "../models/SubscriptionPlan.js";

const PLANS_DATA = [
    {
        name: "FREE",
        displayName: "Free",
        displayNameTR: "Ücretsiz",
        price: {
            monthly: 0,
            yearly: 0,
            currency: "TRY"
        },
        limits: {
            dailyQueries: 5,
            dailyNewsAnalysis: 1,
            dataHistoryYears: 5
        },
        features: [
            "Günlük 5 Finbot sorgusu",
            "Günlük 1 haber analizi",
            "5 yıllık geçmiş veri",
            "Temel portföy takibi",
            "E-posta desteği"
        ],
        sortOrder: 0,
        isActive: true
    },
    {
        name: "PLUS",
        displayName: "Plus",
        displayNameTR: "Plus",
        price: {
            monthly: 99,
            yearly: 948, // 79/month * 12 = ~20% discount
            currency: "TRY"
        },
        limits: {
            dailyQueries: 50,
            dailyNewsAnalysis: 5,
            dataHistoryYears: 10
        },
        features: [
            "Günlük 50 Finbot sorgusu",
            "Günlük 5 haber analizi",
            "10 yıllık geçmiş veri",
            "Gelişmiş portföy analizi",
            "Öncelikli e-posta desteği",
            "Fiyat uyarıları",
            "Teknik analiz göstergeleri"
        ],
        sortOrder: 1,
        isActive: true
    },
    {
        name: "PRO",
        displayName: "Pro",
        displayNameTR: "Pro",
        price: {
            monthly: 249,
            yearly: 2388, // 199/month * 12 = ~20% discount
            currency: "TRY"
        },
        limits: {
            dailyQueries: 150,
            dailyNewsAnalysis: 30,
            dataHistoryYears: 25
        },
        features: [
            "Günlük 150 Finbot sorgusu",
            "Günlük 30 haber analizi",
            "20+ yıllık geçmiş veri",
            "Profesyonel portföy analitiği",
            "7/24 öncelikli destek",
            "Gelişmiş fiyat uyarıları",
            "Tam teknik analiz paketi",
            "API erişimi",
            "Özel raporlar"
        ],
        sortOrder: 2,
        isActive: true
    }
];

async function seedPlans() {
    try {
        console.log("🌱 Connecting to MongoDB...");

        const MONGO_URI = process.env.MONGO_URI;
        if (!MONGO_URI) {
            throw new Error("MONGO_URI is not defined in .env");
        }

        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");

        console.log("\n🌱 Seeding subscription plans...\n");

        for (const planData of PLANS_DATA) {
            // Upsert: Update if exists, insert if not
            const result = await SubscriptionPlan.findOneAndUpdate(
                { name: planData.name },
                planData,
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            console.log(`  ✅ ${planData.name}: ${result.displayNameTR}`);
            console.log(`     - Daily Queries: ${result.limits.dailyQueries}`);
            console.log(`     - Daily News Analysis: ${result.limits.dailyNewsAnalysis}`);
            console.log(`     - Data History: ${result.limits.dataHistoryYears} years`);
            console.log(`     - Price: ₺${result.price.monthly}/month\n`);
        }

        console.log("🎉 Seeding completed successfully!\n");

        // Verify
        const allPlans = await SubscriptionPlan.getActivePlans();
        console.log(`📊 Total active plans in database: ${allPlans.length}`);

    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log("\n👋 MongoDB connection closed");
        process.exit(0);
    }
}

// Run if executed directly
seedPlans();
