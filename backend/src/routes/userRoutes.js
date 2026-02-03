// PATH: backend/src/routes/userRoutes.js
import express from "express";
import {
    getUserProfile,
    updateUserProfile,
    getUserSettings,
    updateUserSettings,
    changePassword,
    deleteAccount,
    completeProfile
} from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";
import { getUserQuotaStatus } from "../middleware/quotaMiddleware.js";
import User from "../models/userModel.js";

const router = express.Router();

// Profile routes
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

// Onboarding - Profile Completion (One-time only)
router.post("/complete-profile", protect, completeProfile);

// Settings routes
router.get("/settings", protect, getUserSettings);
router.put("/settings", protect, updateUserSettings);

// Password change
router.put("/password", protect, changePassword);

// Account deletion
router.delete("/account", protect, deleteAccount);

// Get user quota status (protected route)
router.get("/quota", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ ok: false, message: "Kullanıcı bulunamadı" });
        }

        const quotaStatus = await getUserQuotaStatus(user);

        res.json({
            ok: true,
            data: quotaStatus
        });
    } catch (error) {
        console.error("Quota status error:", error);
        res.status(500).json({ ok: false, message: "Kota durumu alınamadı" });
    }
});

export default router;
