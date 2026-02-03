// PATH: backend/src/controllers/userController.js
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";

/**
 * Get user profile with subscription information
 * GET /api/user/profile
 */
export const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Kullanıcı bulunamadı." });
    }

    const userProfile = {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      fullName: req.user.fullName || "",
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      phoneNumber: req.user.phoneNumber,
      subscriptionTier: req.user.subscriptionTier || "FREE",
      subscriptionStatus: req.user.subscriptionStatus || "INACTIVE",
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
      avatar: req.user.avatar,
      settings: req.user.settings || {},
      // Onboarding status
      isProfileComplete: req.user.isProfileComplete || false,
      profileCompletedAt: req.user.profileCompletedAt,
      surveyData: req.user.surveyData || {},
    };

    res.json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Profil bilgileri alınamadı.", error: error.message });
  }
};

/**
 * Update user profile
 * PUT /api/user/profile
 */
export const updateUserProfile = async (req, res) => {
  try {
    const { username, fullName } = req.body;
    const userId = req.user._id;

    // Check if username is taken (if changed)
    if (username && username !== req.user.username) {
      const existingUser = await User.findOne({
        username: username.toLowerCase(),
        _id: { $ne: userId }
      });
      if (existingUser) {
        return res.status(400).json({ message: "Bu kullanıcı adı zaten kullanılıyor." });
      }
    }

    const updateData = {};
    if (username) updateData.username = username.toLowerCase();
    if (fullName !== undefined) updateData.fullName = fullName;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      ok: true,
      message: "Profil güncellendi.",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
      }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Profil güncellenemedi.", error: error.message });
  }
};

/**
 * Update user settings
 * PUT /api/user/settings
 */
export const updateUserSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    const userId = req.user._id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { settings: settings } },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      ok: true,
      message: "Ayarlar kaydedildi.",
      settings: updatedUser.settings
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ message: "Ayarlar kaydedilemedi.", error: error.message });
  }
};

/**
 * Change user password
 * PUT /api/user/password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mevcut şifre yanlış." });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Yeni şifre en az 6 karakter olmalıdır." });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await User.findByIdAndUpdate(userId, { password: hashedPassword });

    res.json({ ok: true, message: "Şifre başarıyla değiştirildi." });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Şifre değiştirilemedi.", error: error.message });
  }
};

/**
 * Delete user account
 * DELETE /api/user/account
 */
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({ ok: true, message: "Hesap silindi." });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ message: "Hesap silinemedi.", error: error.message });
  }
};

/**
 * Get user settings
 * GET /api/user/settings
 */
export const getUserSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("settings");
    res.json({
      ok: true,
      settings: user?.settings || {}
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ message: "Ayarlar alınamadı.", error: error.message });
  }
};

/**
 * Complete user profile (Onboarding Survey)
 * POST /api/user/complete-profile
 * 
 * RULES:
 * - Only works if isProfileComplete === false
 * - Once completed, survey data becomes READ-ONLY (Gatekeeper pattern)
 */
export const completeProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    // Gatekeeper: Already completed?
    if (user.isProfileComplete) {
      return res.status(403).json({
        ok: false,
        message: "Profil anketi zaten tamamlanmış. Değiştirilemez."
      });
    }

    const {
      investmentExperience,
      riskTolerance,
      investmentGoals,
      preferredSectors,
      monthlyBudget
    } = req.body;

    // Validate required fields
    if (!investmentExperience || !riskTolerance || !investmentGoals || !monthlyBudget) {
      return res.status(400).json({
        ok: false,
        message: "Tüm zorunlu alanlar doldurulmalıdır."
      });
    }

    // Save survey data
    user.surveyData = {
      investmentExperience,
      riskTolerance,
      investmentGoals,
      preferredSectors: preferredSectors || [],
      monthlyBudget
    };
    user.isProfileComplete = true;
    user.profileCompletedAt = new Date();

    await user.save();

    console.log("✅ Profile completed for user:", user.email);

    // Async: Trigger cache preload for Screener performance
    // (non-blocking - user doesn't wait for this)
    setImmediate(async () => {
      try {
        const { refreshFundamentalsCache } = await import("../scripts/fundamentalsCacheJob.js");
        if (refreshFundamentalsCache) {
          console.log("🚀 Triggering fundamentals cache for new user:", user.email);
          refreshFundamentalsCache();
        }
      } catch (err) {
        console.log("⚠️ Cache preload skipped:", err.message);
      }
    });

    res.json({
      ok: true,
      message: "Profil başarıyla tamamlandı.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isProfileComplete: user.isProfileComplete,
        surveyData: user.surveyData
      }
    });
  } catch (error) {
    console.error("Error completing profile:", error);
    res.status(500).json({ message: "Profil tamamlanamadı.", error: error.message });
  }
};
