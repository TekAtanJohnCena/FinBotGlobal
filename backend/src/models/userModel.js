import mongoose from "mongoose";

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
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);