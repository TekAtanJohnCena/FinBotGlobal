// PATH: backend/src/models/Portfolio.js
import mongoose from "mongoose";

const PortfolioSchema = new mongoose.Schema(
  {
    // 👇 KRİTİK EKLEME: Portföyü kullanıcıya bağlıyoruz
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ticker: {
      type: String,
      required: true,
      uppercase: true, // thyao -> THYAO olarak kaydet
      trim: true,
    },
    avgCost: {
      type: Number,
      required: true, // Ortalama Maliyet
    },
    quantity: {
      type: Number,
      required: true, // Adet
    },
    // İsteğe bağlı: Alış tarihi
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Bir kullanıcı aynı hisseden tekrar eklerse ayrı kayıt açmak yerine
// Controller tarafında adet/maliyet güncelleyeceğiz.
// Ancak model tarafında basit tutuyoruz.

export default mongoose.model("Portfolio", PortfolioSchema);