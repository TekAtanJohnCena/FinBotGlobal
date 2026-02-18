// PATH: backend/src/middleware/auth.js
// Authentication Middleware — reads token from HttpOnly cookie OR Authorization header

import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

/**
 * Protect middleware - Verify JWT access token
 * Priority: 1) HttpOnly cookie  2) Authorization Bearer header
 */
export const protect = async (req, res, next) => {
  let token;

  // 1. Try HttpOnly cookie first (new system)
  if (req.cookies?.access_token) {
    token = req.cookies.access_token;
  }
  // 2. Fallback to Authorization header (backward compat + mobile)
  else if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      message: "Yetkisiz işlem, token yok.",
      code: "NO_TOKEN",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password -refreshTokens");
    if (!user) {
      return res.status(401).json({
        message: "Kullanıcı bulunamadı.",
        code: "USER_NOT_FOUND",
      });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (jwtError) {
    if (jwtError.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token süresi dolmuş.",
        code: "TOKEN_EXPIRED",
      });
    }
    if (jwtError.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Geçersiz token.",
        code: "INVALID_TOKEN",
      });
    }
    console.error("Auth middleware error:", jwtError);
    return res.status(401).json({
      message: "Yetkisiz işlem, token geçersiz.",
      code: "AUTH_ERROR",
    });
  }
};

/**
 * Optional authentication - Attach user if token is valid, but don't require it
 */
export const optionalAuth = async (req, res, next) => {
  let token;

  if (req.cookies?.access_token) {
    token = req.cookies.access_token;
  } else if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password -refreshTokens");
      if (user) {
        req.user = user;
        req.userId = user._id;
      }
    } catch {
      // Silently fail - this is optional auth
    }
  }

  next();
};
