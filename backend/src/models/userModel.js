import mongoose from "mongoose";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    // Temel Kimlik Bilgileri
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Google girişleri için required değil

    // Kişisel Bilgiler
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String }, // Google kullanıcıları için opsiyonel, manual için controller'da zorunlu
    birthDate: { type: Date },     // Google kullanıcıları için opsiyonel, manual için controller'da zorunlu

    // Auth Bilgileri
    googleId: { type: String },
    avatar: { type: String },
    authType: {
      type: String,
      enum: ["google", "manual"],
      default: "manual"
    },
    registrationDate: { type: Date, default: Date.now },

    // Abonelik Bilgileri
    subscriptionTier: {
      type: String,
      enum: ["FREE", "BASIC", "PREMIUM"],
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

    // Günlük Kullanım Kotaları (UTC gece yarısı sıfırlanır)
    usage: {
      finbotQueries: { type: Number, default: 0 },
      newsAnalysis: { type: Number, default: 0 },
      lastResetDate: { type: Date, default: Date.now }
    }
  },
  { timestamps: true }
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