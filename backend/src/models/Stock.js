// PATH: backend/src/models/Stock.js
import mongoose from "mongoose";

const stockSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    exchange: {
        type: String,
        required: true, // NASDAQ, NYSE, etc.
        uppercase: true,
        index: true
    },
    sector: {
        type: String,
        default: null
    },
    industry: {
        type: String,
        default: null
    },
    assetType: {
        type: String,
        enum: ['Stock', 'ETF', 'Crypto'],
        default: 'Stock'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Metadata for search optimization
    popularityScore: {
        type: Number,
        default: 0
    },
    logo: String
}, {
    timestamps: true
});

// Compound index for search
stockSchema.index({ symbol: 'text', name: 'text' });

const Stock = mongoose.model("Stock", stockSchema);

export default Stock;
