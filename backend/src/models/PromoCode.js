import mongoose from "mongoose";

const promoCodeSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        discountPercent: {
            type: Number,
            required: true,
            min: 1,
            max: 100,
        },
        maxUses: {
            type: Number,
            default: null, // null means unlimited
        },
        currentUses: {
            type: Number,
            default: 0,
        },
        expiryDate: {
            type: Date,
            default: null, // null means no expiry
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Check if promo code is valid:
promoCodeSchema.methods.isValid = function () {
    if (!this.isActive) return false;
    if (this.maxUses !== null && this.currentUses >= this.maxUses) return false;
    if (this.expiryDate !== null && new Date() > this.expiryDate) return false;
    return true;
};

export default mongoose.model("PromoCode", promoCodeSchema);
