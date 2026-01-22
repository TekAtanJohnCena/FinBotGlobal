// PATH: backend/src/routes/authRoutes.js
import express from "express";
import { register, login, googleLogin, forgotPassword, resetPassword } from "../controllers/authController.js";
import { validate, registerSchema, loginSchema, googleTokenSchema } from "../middleware/validate.js";
import { authRateLimiter } from "../middleware/security.js";

const router = express.Router();

// Kayıt Ol (with validation and rate limiting)
router.post("/register", authRateLimiter, validate(registerSchema), register);

// Giriş Yap (with validation and rate limiting)
router.post("/login", authRateLimiter, validate(loginSchema), login);

// Google ile Giriş (with validation and rate limiting)
router.post("/google", authRateLimiter, validate(googleTokenSchema), googleLogin);

// Şifre Sıfırlama İstediği
router.post("/forgotpassword", authRateLimiter, forgotPassword);

// Şifre Sıfırlama (Token ile)
router.put("/resetpassword/:resetToken", authRateLimiter, resetPassword);

export default router;