import mongoose from "mongoose";
import crypto from "crypto";
import { encryptSensitiveValue, decryptSensitiveValue } from "../utils/fieldEncryption.js";

const userSchema = new mongoose.Schema(
  {
    // Temel Kimlik Bilgileri
    username: { type: String }, // Deprecated — artık zorunlu değil, email-based auth kullanılıyor
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Google girişleri için required değil

    // Kişisel Bilgiler (opsiyonel — sadece email/password zorunlu)
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    phoneNumber: { type: String },   // opsiyonel
    birthDate: { type: Date },       // opsiyonel

    // Auth Bilgileri
    googleId: { type: String },
    avatar: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    authType: {
      type: String,
      enum: ["google", "manual"],
      default: "manual"
    },
    registrationDate: { type: Date, default: Date.now },

    // Abonelik Bilgileri (FREE/PLUS/PRO)
    subscriptionTier: {
      type: String,
      enum: ["FREE", "PLUS", "PRO"],
      default: "FREE"
    },
    subscriptionStatus: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "CANCELLED", "EXPIRED"],
      default: "INACTIVE"
    },

    // Şifre Sıfırlama Bilgileri
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // Refresh Tokens (birden fazla cihaz desteği)
    refreshTokens: [{
      token: { type: String, required: true },
      createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 } // 30 gün TTL
    }],

    // Günlük Kullanım Kotaları (UTC gece yarısı sıfırlanır)
    usage: {
      finbotQueries: { type: Number, default: 0 },
      newsAnalysis: { type: Number, default: 0 },
      lastResetDate: { type: Date, default: Date.now }
    },

    // Email Verification
    isVerified: { type: Boolean, default: false },
    otpCode: { type: String },
    otpExpires: { type: Date },

    // Full Name (for display)
    fullName: { type: String, default: "" },

    // User Settings (all preferences)
    settings: {
      // Chat & Assistant
      responseLength: { type: String, enum: ["short", "normal", "detailed"], default: "normal" },
      language: { type: String, enum: ["tr", "en"], default: "tr" },
      explanationLevel: { type: String, enum: ["simple", "intermediate", "professional"], default: "intermediate" },
      saveHistory: { type: Boolean, default: true },
      autoDelete: { type: String, enum: ["7", "30", "never"], default: "never" },

      // Favorite Stocks
      favoriteStocks: { type: [String], default: ["AAPL", "MSFT", "NVDA", "AMZN"] },

      // Analysis Preferences
      quarterlyEarnings: { type: Boolean, default: true },
      annualFinancials: { type: Boolean, default: true },
      showCharts: { type: Boolean, default: true },
      autoSummary: { type: Boolean, default: true },

      // Notifications
      earningsAlerts: { type: Boolean, default: true },
      financialUpdates: { type: Boolean, default: false },
      priceChangePercent: { type: String, default: "5" },
      weeklySummary: { type: Boolean, default: true },

      // Appearance
      theme: { type: String, enum: ["light", "dark", "system"], default: "dark" },
      numberFormat: { type: String, enum: ["compact", "full"], default: "compact" },
      chartAnimations: { type: Boolean, default: true }
    },

    // Onboarding/Survey Status
    isProfileComplete: { type: Boolean, default: false },
    profileCompletedAt: { type: Date },

    // Survey Data (One-time fill, locked after completion)
    surveyData: {
      investmentExperience: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"]
      },
      riskTolerance: {
        type: String,
        enum: ["conservative", "moderate", "aggressive"]
      },
      investmentGoals: {
        type: String,
        enum: ["short-term", "long-term", "retirement", "income"]
      },
      preferredSectors: [{ type: String }],
      monthlyBudget: {
        type: String,
        enum: ["0-1000", "1000-5000", "5000-10000", "10000+"]
      }
    },

    // Paratika Sanal Pos Entegrasyonu
    paratikaCustomerId: { type: String },
    savedCards: [{
      cardToken: {
        type: String,
        set: encryptSensitiveValue,
        get: decryptSensitiveValue
      },    // Paratika'dan dönen kart token'ı
      cardMask: { type: String },     // Maskelenmiş kart numarası (örn: **** **** **** 4242)
      cardBrand: { type: String },    // Visa, Mastercard vb.
      bankName: { type: String }      // Kartın ait olduğu banka
    }]
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
  }
);

// Şifre sıfırlama token'ı oluşturma methodu
userSchema.methods.getResetPasswordToken = function () {
  // Rastgele token oluştur
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Token'ı hashle ve veritabanına ata
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Süreyi 10 dakika olarak ayarla (ms cinsinden)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

export default mongoose.model("User", userSchema);

