// PATH: backend/src/middleware/subscriptionAuth.js
// Subscription Tier Authorization Middleware

import User from "../models/userModel.js";

/**
 * Middleware to check if user has required subscription tier
 * @param {string[]} allowedTiers - Array of allowed subscription tiers (e.g., ['PREMIUM', 'BASIC'])
 */
export const requireSubscription = (allowedTiers = ["FREE", "BASIC", "PREMIUM"]) => {
  return async (req, res, next) => {
    try {
      // User must be authenticated first (protect middleware should run before this)
      if (!req.user || !req.user._id) {
        return res.status(401).json({
          message: "Kimlik doğrulama gerekli",
        });
      }

      // Fetch fresh user data to ensure subscription status is current
      const user = await User.findById(req.user._id).select("subscriptionTier subscriptionStatus");
      
      if (!user) {
        return res.status(404).json({
          message: "Kullanıcı bulunamadı",
        });
      }

      // Check if user's tier is in allowed tiers
      const userTier = user.subscriptionTier || "FREE";
      const userStatus = user.subscriptionStatus || "INACTIVE";
      
      // Only ACTIVE subscriptions are valid
      if (userStatus !== "ACTIVE" && userTier !== "FREE") {
        return res.status(403).json({
          message: "Aktif bir abonelik gereklidir",
          requiredTier: allowedTiers,
          currentTier: userTier,
          subscriptionStatus: userStatus,
        });
      }

      if (!allowedTiers.includes(userTier)) {
        return res.status(403).json({
          message: "Bu özellik için yeterli abonelik seviyeniz yok",
          requiredTier: allowedTiers,
          currentTier: userTier,
        });
      }

      // Add subscription info to request for use in controllers
      req.user.subscriptionTier = userTier;
      req.user.subscriptionStatus = userStatus;

      next();
    } catch (error) {
      console.error("Subscription authorization error:", error);
      res.status(500).json({
        message: "Abonelik kontrolü sırasında bir hata oluştu",
      });
    }
  };
};

/**
 * Convenience middlewares for specific tiers
 */
export const requirePremium = requireSubscription(["PREMIUM"]);
export const requireBasic = requireSubscription(["BASIC", "PREMIUM"]);
export const requireAnySubscription = requireSubscription(["BASIC", "PREMIUM"]);


