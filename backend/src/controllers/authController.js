// PATH: backend/src/controllers/authController.js
// Production-ready Authentication Controller
// Access Token (15m, HttpOnly cookie) + Refresh Token (30d, HttpOnly cookie)

import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { asyncHandler } from "../utils/errorHandler.js";
import { sendWelcomeEmail, sendPasswordResetEmail, sendVerificationEmail } from "../services/emailService.js";

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
  username: user.username,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  avatar: user.avatar,
  authType: user.authType,
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
  const { username, email, password, firstName, lastName, phoneNumber, birthDate } = req.body;

  // Zorunlu alan kontrolü
  if (!username || !email || !password || !firstName || !lastName || !phoneNumber || !birthDate) {
    return res.status(400).json({
      message: "Tüm zorunlu alanlar doldurulmalıdır (Ad, Soyad, Telefon, Doğum Tarihi, Kullanıcı Adı, E-posta, Şifre).",
    });
  }

  // E-posta kontrolü
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    return res.status(409).json({
      message: "Bu e-posta adresi zaten kayıtlı.",
    });
  }

  // Kullanıcı adı kontrolü
  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    return res.status(409).json({
      message: "Bu kullanıcı adı zaten kullanılıyor.",
    });
  }

  // Şifre hashleme
  const hashedPassword = await bcrypt.hash(password, 12);

  // 6 haneli OTP kodu üret
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 dakika

  // Yeni kullanıcı oluştur (Unverified)
  const newUser = await User.create({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password: hashedPassword,
    firstName,
    lastName,
    phoneNumber,
    birthDate: new Date(birthDate),
    authType: "manual",
    subscriptionTier: "FREE",
    subscriptionStatus: "INACTIVE",
    isVerified: false,
    otpCode,
    otpExpires
  });

  console.log("✅ User registered (pending verification):", newUser.email);

  // Doğrulama maili gönder
  try {
    await sendVerificationEmail(newUser.email, otpCode);
  } catch (error) {
    console.error("OTP send failed:", error);
    await User.findByIdAndDelete(newUser._id);
    return res.status(500).json({ message: "Doğrulama kodu gönderilemedi. Lütfen tekrar deneyin." });
  }

  // Token DÖNME, sadece başarı mesajı dön
  res.status(201).json({
    success: true,
    message: "Kayıt başarılı! Lütfen e-postanıza gönderilen doğrulama kodunu giriniz.",
    email: newUser.email
  });
});

/* =====================================================
   2. LOGIN (EMAIL/USERNAME + PASSWORD)
   ===================================================== */
export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      message: "E-posta/Kullanıcı adı ve şifre gerekli.",
    });
  }

  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ]
  }).select("+password");

  if (!user || !user.password) {
    return res.status(401).json({
      message: "E-posta/Kullanıcı adı veya şifre hatalı.",
    });
  }

  // E-Posta doğrulama kontrolü
  if (user.isVerified === false) {
    return res.status(401).json({
      message: "Lütfen önce e-posta adresinizi doğrulayın. (Mail kutunuzu kontrol edin)",
      isNotVerified: true,
      email: user.email
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({
      message: "E-posta/Kullanıcı adı veya şifre hatalı.",
    });
  }

  console.log("✅ User logged in:", user.email);

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
    console.error("❌ Google Token Verify Error:", err);
    return res.status(401).json({
      message: "Google doğrulaması başarısız.",
    });
  }

  if (!payload || !payload.email) {
    console.error("❌ Google payload email missing:", payload);
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
      console.log("✅ Existing user updated with Google ID:", email);
    } else {
      console.log("✅ Existing Google user logged in:", email);
    }
  } else {
    user = await User.create({
      username: email.split("@")[0],
      email,
      googleId: sub,
      avatar: picture,
      firstName,
      lastName,
      authType: "google",
      subscriptionTier: "FREE",
      subscriptionStatus: "INACTIVE",
      isVerified: true,
    });
    console.log("✅ New Google user created:", email);

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
  console.log('🔔 Forgot Password isteği 5000 portuna ulaştı!');
  const { email } = req.body;
  console.log("🔍 Şifre sıfırlama isteği:", email);

  if (!email) {
    return res.status(400).json({ message: "E-posta adresi gerekli." });
  }

  const user = await User.findOne({ email });

  if (!user) {
    console.log("❌ Kullanıcı bulunamadı:", email);
    return res.status(404).json({ message: "Bu e-posta adresine sahip bir kullanıcı bulunamadı." });
  }

  console.log("✅ Kullanıcı bulundu:", user.email);

  const resetToken = user.getResetPasswordToken();
  console.log("🎫 Token üretildi");

  await user.save({ validateBeforeSave: false });
  console.log("💾 Kullanıcı token ile kaydedildi");

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  console.log("🔗 Sıfırlama linki oluşturuldu");

  try {
    await sendPasswordResetEmail(user.email, resetToken);
    console.log("📧 Mail gönderildi:", user.email);

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

/* =====================================================
   6. VERIFY EMAIL (OTP)
   ===================================================== */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: "E-posta ve doğrulama kodu gerekli." });
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
    otpCode: code,
    otpExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ message: "Geçersiz veya süresi dolmuş kod." });
  }

  user.isVerified = true;
  user.otpCode = undefined;
  user.otpExpires = undefined;

  console.log("✅ User verified email:", user.email);

  // Hoşgeldin maili gönder
  try {
    await sendWelcomeEmail(user.email, user.firstName);
  } catch (err) {
    console.error("Welcome email failed:", err);
  }

  // Issue dual tokens + set cookies
  const accessToken = await issueTokens(res, user);

  res.status(200).json({
    success: true,
    message: "E-posta başarıyla doğrulandı.",
    token: accessToken, // Backward compat
    user: buildUserResponse(user),
  });
});

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

  console.log("🔄 Token refreshed for:", user.email);

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
        console.log("🚪 User logged out:", user.email);
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
