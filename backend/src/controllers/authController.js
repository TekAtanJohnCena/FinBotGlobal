// PATH: backend/src/controllers/authController.js
// Production-ready Authentication Controller
// Access Token (15m, HttpOnly cookie) + Refresh Token (30d, HttpOnly cookie)

import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { asyncHandler } from "../utils/errorHandler.js";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../services/emailService.js";

// ==============================
// Google OAuth Client
// ==============================
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ==============================
// Token Generators
// ==============================
const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d" }
  );
};

// ==============================
// Helper: Set BOTH tokens as HttpOnly Cookies
// ==============================
const IS_PROD = process.env.NODE_ENV === "production";

const setTokenCookies = (res, accessToken, refreshToken) => {
  // Access Token cookie — short-lived (15 min)
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? "none" : "lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: "/",
  });

  // Refresh Token cookie — long-lived (30 days)
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? "none" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: "/api/auth", // Only sent to auth endpoints (security)
  });
};

// Helper: Clear auth cookies
const clearTokenCookies = (res) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? "none" : "lax",
    path: "/",
  });
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? "none" : "lax",
    path: "/api/auth",
  });
  // Also clear legacy "token" cookie if exists
  res.clearCookie("token", {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? "none" : "lax",
    path: "/",
  });
};

// Helper: Build user response object
const buildUserResponse = (user) => ({
  id: user._id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
  avatar: user.avatar,
  authType: user.authType,
  role: user.role || "user",
  subscriptionTier: user.subscriptionTier || "FREE",
  subscriptionStatus: user.subscriptionStatus || "INACTIVE",
  isProfileComplete: user.isProfileComplete || false,
});

// Helper: Issue tokens, save refresh token to DB, set cookies
const issueTokens = async (res, user) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token to user's refreshTokens array
  // Keep max 5 refresh tokens per user (multi-device support)
  if (!user.refreshTokens) user.refreshTokens = [];
  user.refreshTokens.push({ token: refreshToken });
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, accessToken, refreshToken);
  return accessToken;
};

/* =====================================================
   1. REGISTER (EMAIL + PASSWORD)
   ===================================================== */
export const register = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Zorunlu alan kontrolü
  if (!email || !password) {
    return res.status(400).json({
      message: "E-posta ve şifre gereklidir.",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: "Şifre en az 6 karakter olmalıdır.",
    });
  }

  // E-posta kontrolü
  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    return res.status(409).json({
      message: "Bu e-posta adresi zaten kayıtlı.",
    });
  }

  // Şifre hashleme
  const hashedPassword = await bcrypt.hash(password, 12);

  // E-posta adresinin @ öncesi kısmını isim olarak kullan
  const emailPrefix = email.split("@")[0];
  const autoName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);

  // Yeni kullanıcı oluştur
  const newUser = await User.create({
    email: email.toLowerCase(),
    password: hashedPassword,
    firstName: autoName,
    lastName: "",
    fullName: autoName,
    authType: "manual",
    subscriptionTier: "FREE",
    subscriptionStatus: "INACTIVE",
    isVerified: true,
  });

  // Hoşgeldin maili gönder
  try {
    await sendWelcomeEmail(newUser.email, newUser.firstName);
  } catch (err) {
    console.error("Welcome email failed:", err);
  }

  // Issue dual tokens + set cookies (auto-login)
  const accessToken = await issueTokens(res, newUser);

  res.status(201).json({
    success: true,
    message: "Kayıt başarılı!",
    token: accessToken,
    user: buildUserResponse(newUser),
  });
});

/* =====================================================
   2. LOGIN (EMAIL + PASSWORD)
   ===================================================== */
export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      message: "E-posta ve şifre gerekli.",
    });
  }

  const user = await User.findOne({
    email: identifier.toLowerCase()
  }).select("+password");

  if (!user || !user.password) {
    return res.status(401).json({
      message: "Geçersiz e-posta veya şifre.",
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({
      message: "Geçersiz e-posta veya şifre.",
    });
  }

  // E-Posta doğrulama kontrolü (only after credentials are verified)
  if (user.isVerified === false) {
    return res.status(401).json({
      message: "Lütfen önce e-posta adresinizi doğrulayın. (Mail kutunuzu kontrol edin)",
      isNotVerified: true,
      email: user.email
    });
  }


  // Issue dual tokens + set cookies
  const accessToken = await issueTokens(res, user);

  res.status(200).json({
    token: accessToken, // Backward compat for frontend transition
    user: buildUserResponse(user),
  });
});

/* =====================================================
   3. GOOGLE LOGIN (ID TOKEN)
   ===================================================== */
export const googleLogin = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      message: "Google token gerekli.",
    });
  }

  let payload;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    payload = ticket.getPayload();
  } catch (err) {
    console.error("❌ Google Token Verify Error:", err.message);
    console.error("❌ Google Auth Error Detail:", err.errors || err.code || err);
    return res.status(401).json({
      message: "Google doğrulaması başarısız.",
    });
  }

  if (!payload || !payload.email) {
    console.error("❌ Google payload email missing");
    return res.status(400).json({
      message: "Google hesabından e-posta alınamadı.",
    });
  }

  const { name, email, picture, sub, given_name, family_name } = payload;

  const firstName = given_name || name?.split(" ")[0] || "Google";
  const lastName = family_name || name?.split(" ").slice(1).join(" ") || "User";

  let user = await User.findOne({ email });

  if (user) {
    if (!user.googleId) {
      user.googleId = sub;
      user.avatar = picture;
      user.authType = "google";
      if (!user.firstName) user.firstName = firstName;
      if (!user.lastName) user.lastName = lastName;
      await user.save();
    } else {
    }
  } else {
    try {
      user = await User.create({
        email,
        googleId: sub,
        avatar: picture,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        authType: "google",
        subscriptionTier: "FREE",
        subscriptionStatus: "INACTIVE",
        isVerified: true,
      });
    } catch (createErr) {
      console.error("❌ Google User.create FAILED:", createErr.message);
      console.error("❌ Error details:", JSON.stringify(createErr.errors || createErr.keyPattern || {}, null, 2));
      if (createErr.code === 11000) {
        console.error("❌ Duplicate key error — likely stale 'username' unique index. keyPattern:", createErr.keyPattern);
        return res.status(409).json({
          message: "Bu hesap zaten mevcut. Lütfen giriş yapın.",
        });
      }
      return res.status(400).json({
        message: "Kullanıcı oluşturulamadı: " + (createErr.message || "Bilinmeyen hata"),
      });
    }

    try {
      await sendWelcomeEmail(user.email, user.firstName || "Finbot Kullanıcısı");
    } catch (emailErr) {
      console.error("❌ Welcome email failed for Google user:", emailErr.message);
    }
  }

  // Issue dual tokens + set cookies
  const accessToken = await issueTokens(res, user);

  res.status(200).json({
    token: accessToken, // Backward compat
    user: buildUserResponse(user),
  });
});

/* =====================================================
   4. FORGOT PASSWORD
   ===================================================== */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "E-posta adresi gerekli." });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "Bu e-posta adresine sahip bir kullanıcı bulunamadı." });
  }


  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({
      message: "Şifre sıfırlama e-postası gönderildi."
    });
  } catch (error) {
    console.error("❌ Mail gönderme hatası:", error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return res.status(500).json({ message: "E-posta gönderilemedi." });
  }
});

/* =====================================================
   5. RESET PASSWORD
   ===================================================== */
export const resetPassword = asyncHandler(async (req, res) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "Geçersiz veya süresi dolmuş token." });
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 12);
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.status(200).json({
    message: "Şifre başarıyla güncellendi."
  });
});

// NOTE: verifyEmail removed — registration now auto-verifies and issues tokens

/* =====================================================
   7. REFRESH TOKEN — Silent access token renewal
   ===================================================== */
export const refreshTokenHandler = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refresh_token;

  if (!incomingRefreshToken) {
    return res.status(401).json({
      message: "Refresh token bulunamadı.",
      code: "NO_REFRESH_TOKEN",
    });
  }

  // Verify the refresh token
  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    // Token expired or invalid — clear cookies and force re-login
    clearTokenCookies(res);
    return res.status(401).json({
      message: "Refresh token geçersiz veya süresi dolmuş. Lütfen tekrar giriş yapın.",
      code: "REFRESH_TOKEN_EXPIRED",
    });
  }

  // Find user and verify the refresh token exists in their DB record
  const user = await User.findById(decoded.id);
  if (!user) {
    clearTokenCookies(res);
    return res.status(401).json({
      message: "Kullanıcı bulunamadı.",
      code: "USER_NOT_FOUND",
    });
  }

  const tokenExists = user.refreshTokens?.some(rt => rt.token === incomingRefreshToken);
  if (!tokenExists) {
    // Possible token theft — clear ALL refresh tokens for this user
    user.refreshTokens = [];
    await user.save({ validateBeforeSave: false });
    clearTokenCookies(res);
    return res.status(401).json({
      message: "Refresh token geçersiz. Güvenlik nedeniyle oturumunuz kapatıldı.",
      code: "REFRESH_TOKEN_REUSE",
    });
  }

  // Token rotation: remove old, issue new pair
  user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== incomingRefreshToken);

  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshTokens.push({ token: newRefreshToken });
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, newAccessToken, newRefreshToken);


  res.status(200).json({
    success: true,
    message: "Token yenilendi.",
    user: buildUserResponse(user),
  });
});

/* =====================================================
   8. LOGOUT — Clear cookies + remove refresh token from DB
   ===================================================== */
export const logoutHandler = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refresh_token;

  if (incomingRefreshToken) {
    try {
      const decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.id);
      if (user) {
        user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== incomingRefreshToken);
        await user.save({ validateBeforeSave: false });
      }
    } catch {
      // Token invalid — just clear cookies
    }
  }

  clearTokenCookies(res);

  res.status(200).json({
    success: true,
    message: "Başarıyla çıkış yapıldı.",
  });
});
