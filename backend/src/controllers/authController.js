// PATH: backend/src/controllers/authController.js
// Production-ready Authentication Controller (JWT + Google ID Token + Cookie)

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
    // Mail atılamazsa kullanıcıyı sil ki tekrar deneyebilsin (veya logla)
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

  // E-Posta doğrulama kontrolü
  if (user.isVerified === false) {
    return res.status(401).json({
      message: "Lütfen önce e-posta adresinizi doğrulayın. (Mail kutunuzu kontrol edin)",
      isNotVerified: true, // Frontend bu flag'i kullanabilir
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
      isVerified: true, // Google ile gelen kullanıcılar doğrulanmış sayılır
    });
    console.log("✅ New Google user created:", email);

    // Yeni kullanıcı için hoşgeldin maili gönder (Hata olsa bile giriş devam etsin)
    try {
      await sendWelcomeEmail(user.email, user.firstName || "Finbot Kullanıcısı");
    } catch (emailErr) {
      console.error("❌ Welcome email failed for Google user:", emailErr.message);
    }
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

  // Şifre sıfırlama token'ı al
  const resetToken = user.getResetPasswordToken();
  console.log("🎫 Token üretildi");

  // validateBeforeSave: false ekledik çünkü diğer zorunlu alanlar (firstName vb.) 
  // bu save işleminde hata verebilir
  await user.save({ validateBeforeSave: false });
  console.log("💾 Kullanıcı token ile kaydedildi");

  // URL oluştur (Path segment olarak)
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
  // Hashlenmiş token'ı parametreden alıp veritabanında ara
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

  // Yeni şifreyi ayarla
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

  // Doğrulama başarılı
  user.isVerified = true;
  user.otpCode = undefined;
  user.otpExpires = undefined;
  await user.save();

  console.log("✅ User verified email:", user.email);

  // Hoşgeldin maili gönder
  try {
    await sendWelcomeEmail(user.email, user.firstName);
  } catch (err) {
    console.error("Welcome email failed:", err);
  }

  // Giriş yap (Token üret)
  const accessToken = generateAccessToken(user._id);
  setAuthCookie(res, accessToken);

  res.status(200).json({
    success: true,
    message: "E-posta başarıyla doğrulandı.",
    token: accessToken,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      birthDate: user.birthDate,
      authType: user.authType,
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
    }
  });
});
