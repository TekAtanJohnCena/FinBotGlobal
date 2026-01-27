// PATH: backend/src/routes/userRoutes.js
import express from "express";
import { getUserProfile } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";
import { getUserQuotaStatus } from "../middleware/quotaMiddleware.js";
import User from "../models/userModel.js";

const router = express.Router();

// Get user profile (protected route)
router.get("/profile", protect, getUserProfile);

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


