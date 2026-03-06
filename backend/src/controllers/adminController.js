import User from "../models/userModel.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import Chat from "../models/Chat.js";
import PromoCode from "../models/PromoCode.js";

// @desc    Get dashboard metrics (Active Users, Subscriptions, Stats)
// @route   GET /api/admin/metrics
// @access  Private/Admin
export const getDashboardMetrics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsersCount = await User.countDocuments({ "subscriptionStatus": "ACTIVE" }); // Assuming active means has active sub, or could be logged in recently

        // Count Plus and Pro users
        const plusUsersCount = await User.countDocuments({ subscriptionTier: "PLUS" });
        const proUsersCount = await User.countDocuments({ subscriptionTier: "PRO" });

        // Count queries
        // Assuming Chat model stores user queries. We can aggregate by user or just total.
        const totalQueries = await Chat.countDocuments(); // Simple total queries metric

        res.json({
            success: true,
            data: {
                totalUsers,
                activeUsersCount,
                plusUsersCount,
                proUsersCount,
                totalQueries
            }
        });
    } catch (error) {
        console.error("Admin Dashboard Metrics Error:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası" });
    }
};

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsersList = async (req, res) => {
    try {
        const users = await User.find({})
            .select("-password -__v -refreshTokens")
            .sort({ createdAt: -1 });

        // Get query counts per user
        // Note: In Chat model, the field is 'user', not 'userId'
        const queryCounts = await Chat.aggregate([
            { $unwind: "$messages" },
            { $match: { "messages.sender": "user" } },
            { $group: { _id: "$user", count: { $sum: 1 } } }
        ]);

        const queryMap = {};
        queryCounts.forEach(q => {
            if (q._id) {
                queryMap[q._id.toString()] = q.count;
            }
        });

        const enhancedUsers = users.map(user => {
            const userIdStr = user._id.toString();
            return {
                ...user.toObject(),
                queryCount: queryMap[userIdStr] || 0
            };
        });

        res.json({
            success: true,
            data: enhancedUsers
        });
    } catch (error) {
        console.error("Admin Users List Error:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası" });
    }
};

// @desc    Get list of payment transactions
// @route   GET /api/admin/transactions
// @access  Private/Admin
export const getTransactionsList = async (req, res) => {
    try {
        const transactions = await PaymentTransaction.find({})
            .populate("user", "email firstName fullName")
            .populate("promoCode", "code discountPercent")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: transactions
        });
    } catch (error) {
        console.error("Admin Transactions List Error:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası" });
    }
};

// ======================== PROMO CODES ==========================

// @desc    Create a new promo code
// @route   POST /api/admin/promos
// @access  Private/Admin
export const createPromoCode = async (req, res) => {
    try {
        const { code, discountPercent, maxUses, expiryDate } = req.body;

        const existingPromo = await PromoCode.findOne({ code: code.trim().toUpperCase() });
        if (existingPromo) {
            return res.status(400).json({ success: false, message: "Bu kod zaten mevcut." });
        }

        const newPromo = await PromoCode.create({
            code: code.trim().toUpperCase(),
            discountPercent,
            maxUses: maxUses || null,
            expiryDate: expiryDate || null
        });

        res.json({
            success: true,
            data: newPromo
        });
    } catch (error) {
        console.error("Admin Create Promo Error:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası" });
    }
};

// @desc    Get all promo codes
// @route   GET /api/admin/promos
// @access  Private/Admin
export const getPromoCodes = async (req, res) => {
    try {
        const promos = await PromoCode.find({}).sort({ createdAt: -1 });

        res.json({
            success: true,
            data: promos
        });
    } catch (error) {
        console.error("Admin Get Promos Error:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası" });
    }
};

// @desc    Toggle promo code status (activate/deactivate)
// @route   PUT /api/admin/promos/:id/toggle
// @access  Private/Admin
export const togglePromoCode = async (req, res) => {
    try {
        const promo = await PromoCode.findById(req.params.id);
        if (!promo) return res.status(404).json({ success: false, message: "Promosyon kodu bulunamadı." });

        promo.isActive = !promo.isActive;
        await promo.save();

        res.json({
            success: true,
            data: promo
        });
    } catch (error) {
        console.error("Admin Toggle Promo Error:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası" });
    }
};

// @desc    Update user subscription tier manually
// @route   PATCH /api/admin/users/:id/subscription
// @access  Private/Admin
export const updateUserSubscription = async (req, res) => {
    try {
        const { tier } = req.body;

        if (!["FREE", "PLUS", "PRO"].includes(tier)) {
            return res.status(400).json({ success: false, message: "Geçersiz üyelik tipi" });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı" });
        }

        user.subscriptionTier = tier;
        // If tier is FREE, set status to INACTIVE, otherwise ACTIVE
        user.subscriptionStatus = tier === "FREE" ? "INACTIVE" : "ACTIVE";
        await user.save();

        res.json({
            success: true,
            message: `Kullanıcı başarıyla ${tier} üyeliğine güncellendi`,
            data: {
                _id: user._id,
                email: user.email,
                subscriptionTier: user.subscriptionTier,
                subscriptionStatus: user.subscriptionStatus
            }
        });
    } catch (error) {
        console.error("Admin Update Subscription Error:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası" });
    }
};
