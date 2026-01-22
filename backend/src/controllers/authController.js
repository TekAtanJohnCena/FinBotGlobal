// PATH: backend/src/controllers/authController.js
// Production-ready Authentication Controller (JWT + Google ID Token + Cookie)

import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { asyncHandler } from "../utils/errorHandler.js";

// ==============================
// Google OAuth Client
// ==============================
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ==============================
// JWT Generator
// ==============================
const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    }
  );
};

// ==============================
// Helper: Set Auth Cookie (PROD SAFE)
// ==============================
const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,        // HTTPS zorunlu (Render + Domain)
    sameSite: "none",    // Frontend & Backend farklı domain
    maxAge: 15 * 60 * 1000, // 15 dakika
  });
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

  // Yeni kullanıcı oluştur
  const newUser = await User.create({
    username,
    email,
    password: hashedPassword,
    firstName,
    lastName,
    phoneNumber,
    birthDate: new Date(birthDate),
    authType: "manual",
    subscriptionTier: "FREE",
    subscriptionStatus: "INACTIVE",
  });

  console.log("✅ User registered:", newUser.email);

  const accessToken = generateAccessToken(newUser._id);
  setAuthCookie(res, accessToken);

  res.status(201).json({
    message: "Kullanıcı başarıyla oluşturuldu.",
    token: accessToken,
    user: {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      phoneNumber: newUser.phoneNumber,
      birthDate: newUser.birthDate,
      authType: newUser.authType,
      subscriptionTier: newUser.subscriptionTier,
      subscriptionStatus: newUser.subscriptionStatus,
    },
  });
});

/* =====================================================
   2. LOGIN (EMAIL/USERNAME + PASSWORD)
   ===================================================== */
export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  // identifier can be either email or username
  if (!identifier || !password) {
    return res.status(400).json({
      message: "E-posta/Kullanıcı adı ve şifre gerekli.",
    });
  }

  // Find user by email OR username
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

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({
      message: "E-posta/Kullanıcı adı veya şifre hatalı.",
    });
  }

  console.log("✅ User logged in:", user.email);

  const accessToken = generateAccessToken(user._id);
  setAuthCookie(res, accessToken);

  res.status(200).json({
    token: accessToken,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      subscriptionTier: user.subscriptionTier || "FREE",
      subscriptionStatus: user.subscriptionStatus || "INACTIVE",
    },
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

  // Google'dan gelen ismi firstName ve lastName olarak ayır
  const firstName = given_name || name?.split(" ")[0] || "Google";
  const lastName = family_name || name?.split(" ").slice(1).join(" ") || "User";

  let user = await User.findOne({ email });

  if (user) {
    // Mevcut kullanıcı - Google ID'yi güncelle
    if (!user.googleId) {
      user.googleId = sub;
      user.avatar = picture;
      user.authType = "google";
      // firstName/lastName yoksa ekle
      if (!user.firstName) user.firstName = firstName;
      if (!user.lastName) user.lastName = lastName;
      await user.save();
      console.log("✅ Existing user updated with Google ID:", email);
    } else {
      console.log("✅ Existing Google user logged in:", email);
    }
  } else {
    // Yeni kullanıcı oluştur
    user = await User.create({
      username: email.split("@")[0], // Email'den benzersiz username oluştur
      email,
      googleId: sub,
      avatar: picture,
      firstName,
      lastName,
      authType: "google",
      subscriptionTier: "FREE",
      subscriptionStatus: "INACTIVE",
    });
    console.log("✅ New Google user created:", email);
  }

  const accessToken = generateAccessToken(user._id);
  setAuthCookie(res, accessToken);

  res.status(200).json({
    token: accessToken,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      authType: user.authType,
      subscriptionTier: user.subscriptionTier || "FREE",
      subscriptionStatus: user.subscriptionStatus || "INACTIVE",
    },
  });
});
