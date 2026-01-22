// PATH: backend/src/middleware/auth.js
// Enhanced Authentication Middleware with Refresh Token Support

import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

/**
 * Protect middleware - Verify JWT token
 * Enhanced with better error handling
 */
export const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract token from "Bearer TOKEN"
      token = req.headers.authorization.split(" ")[1];

      if (!token) {
        return res.status(401).json({ 
          message: "Yetkisiz işlem, token yok." 
        });
      }

      // 2. Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (jwtError) {
        if (jwtError.name === "TokenExpiredError") {
          return res.status(401).json({ 
            message: "Token süresi dolmuş. Lütfen tekrar giriş yapın.",
            code: "TOKEN_EXPIRED"
          });
        }
        if (jwtError.name === "JsonWebTokenError") {
          return res.status(401).json({ 
            message: "Geçersiz token.",
            code: "INVALID_TOKEN"
          });
        }
        throw jwtError;
      }

      // 3. Find user and attach to request
      const user = await User.findById(decoded.id).select("-password");
      
      if (!user) {
        return res.status(401).json({ 
          message: "Kullanıcı bulunamadı.",
          code: "USER_NOT_FOUND"
        });
      }

      // Attach user to request
      req.user = user;
      req.userId = user._id; // Convenience property

      next();
    } catch (error) {
      // Log error but don't expose details
      console.error("Auth middleware error:", error);
      return res.status(401).json({ 
        message: "Yetkisiz işlem, token geçersiz.",
        code: "AUTH_ERROR"
      });
    }
  } else {
    // No token provided
    return res.status(401).json({ 
      message: "Yetkisiz işlem, token yok.",
      code: "NO_TOKEN"
    });
  }
};

/**
 * Optional authentication - Attach user if token is valid, but don't require it
 */
export const optionalAuth = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (user) {
          req.user = user;
          req.userId = user._id;
        }
      }
    } catch (error) {
      // Silently fail - this is optional auth
    }
  }
  next();
};
