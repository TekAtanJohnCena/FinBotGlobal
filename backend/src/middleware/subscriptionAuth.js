// PATH: backend/src/middleware/subscriptionAuth.js
// Subscription Tier Authorization Middleware

import User from "../models/userModel.js";

/**
 * Tier aliases for backward compatibility
 */
const TIER_ALIASES = { BASIC: "PLUS", PREMIUM: "PRO" };

/**
 * Normalize tier name
 */
const normalizeTier = (tier) => {
  if (!tier) return "FREE";
  const upper = tier.toUpperCase();
  return TIER_ALIASES[upper] || upper;
};

/**
 * Middleware to check if user has required subscription tier
 * @param {string[]} allowedTiers - Array of allowed subscription tiers (e.g., ['PRO', 'PLUS'])
 */
export const requireSubscription = (allowedTiers = ["FREE", "PLUS", "PRO"]) => {
  // Normalize allowed tiers
  const normalizedAllowed = allowedTiers.map(t => normalizeTier(t));

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
      const userTier = normalizeTier(user.subscriptionTier);
      const userStatus = user.subscriptionStatus || "INACTIVE";

      // Only ACTIVE subscriptions are valid (or FREE tier which doesn't require payment)
      if (userStatus !== "ACTIVE" && userTier !== "FREE") {
        return res.status(403).json({
          message: "Aktif bir abonelik gereklidir",
          requiredTier: normalizedAllowed,
          currentTier: userTier,
          subscriptionStatus: userStatus,
        });
      }

      if (!normalizedAllowed.includes(userTier)) {
        return res.status(403).json({
          error: "subscription_required",
          message: "Bu özellik için yeterli abonelik seviyeniz yok",
          requiredTier: normalizedAllowed,
          currentTier: userTier,
          upgradeUrl: "/pricing"
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
export const requirePro = requireSubscription(["PRO"]);
export const requirePlus = requireSubscription(["PLUS", "PRO"]);
export const requireAnyPaid = requireSubscription(["PLUS", "PRO"]);

// Backward compatibility aliases
export const requirePremium = requirePro;
export const requireBasic = requirePlus;
export const requireAnySubscription = requireAnyPaid;
