import mongoose from "mongoose";

const PortfolioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
    },
    avgCost: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    }
  },
  { timestamps: true }
);

export default mongoose.model("Portfolio", PortfolioSchema);