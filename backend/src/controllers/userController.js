// PATH: backend/src/controllers/userController.js
import User from "../models/userModel.js";

/**
 * Get user profile with subscription information
 * GET /api/user/profile
 */
export const getUserProfile = async (req, res) => {
  try {
    // req.user is set by the protect middleware
    if (!req.user) {
      return res.status(401).json({ message: "Kullanıcı bulunamadı." });
    }

    // Return user data (password is already excluded by select("-password") in middleware)
    const userProfile = {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      subscriptionTier: req.user.subscriptionTier || "FREE",
      subscriptionStatus: req.user.subscriptionStatus || "INACTIVE",
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
      avatar: req.user.avatar,
    };

    res.json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Profil bilgileri alınamadı.", error: error.message });
  }
};

