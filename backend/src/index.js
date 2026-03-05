// PATH: backend/src/index.js
/**
 * FinBot Backend - Main Entry Point
 * Production-ready with security middleware, rate limiting, and error handling
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

// SECURITY MIDDLEWARE
import { securityHeaders } from "./middleware/security.js";
import { generalLimiter, tiingoLimiter } from "./middleware/rateLimiter.js";
import compression from "compression";
import morgan from "morgan";
import logger, { morganStream } from "./utils/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

// ROUTE IMPORTS
import authRoutes from "./routes/authRoutes.js";

import financeChartRoutes from "./routes/financeChart.js";
import portfolioRoutes from "./routes/portfolio.js";
import walletRoutes from "./routes/walletRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import apiRoutes from "./routes/api.js";
import newsRoutes from "./routes/news.js";
import aiRoutes from "./routes/ai.routes.js"; // AI Layer
import subscriptionRoutes from "./routes/subscriptionRoutes.js"; // Subscription Management
import stockRoutes from "./routes/stocks.js"; // US Stock Database
import transactionRoutes from "./routes/transactionRoutes.js"; // Transaction CRUD
import paymentRoutes from "./routes/paymentRoutes.js"; // Paratika Payment Integration
import personalFinanceRoutes from "./routes/financeRoutes.js"; // Personal Finance PDF Upload
import adminRoutes from "./routes/adminRoutes.js"; // Admin Panel Routes
import { sendContactEmail } from "./services/emailService.js";
import { initPaymentCron } from "./services/paymentCron.js";
import { initSubscriptionCron } from "./cron/subscriptionCron.js";

// ADDITIONAL IMPORTS for /api/chats endpoint
import { protect } from "./middleware/auth.js";
import { getChatHistory } from "./controllers/chatController.js";
import cacheManager from "./utils/cacheManager.js";
import { seedInitialStocks } from "./scripts/seedStocks.js";
import { startFundamentalsCacheJob } from "./scripts/fundamentalsCacheJob.js";

const app = express();
app.set('trust proxy', 1);

// DEV MODE: Clear corrupted cache on startup
if (process.env.NODE_ENV !== 'production') {
  const clearedCount = cacheManager.clearAll();
  console.log(`🧹 DEV MODE: Cleared ${clearedCount} cache files on startup`);
}

// ===== Paratika Callback (BEFORE CORS — receives redirects from Paratika domain) =====
// These routes MUST be registered before CORS middleware, because Paratika POSTs
// from vpos.paratika.com.tr origin which would be blocked by CORS.
// Note: paymentRoutes.js also has /callback routes, but they won't be reached
// because these earlier registrations take priority.
import { handleCallback } from "./controllers/paymentController.js";
app.post("/api/payment/callback", express.urlencoded({ extended: true }), express.json(), handleCallback);
app.get("/api/payment/callback", handleCallback);

// ===== Middleware & CORS =====
const isProduction = process.env.NODE_ENV === "production";
const normalizeOrigin = (origin) => String(origin || "").replace(/\/+$/, "");

const productionOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  "https://finbot.com.tr",
  "https://www.finbot.com.tr",
].filter(Boolean).map(normalizeOrigin);

const developmentOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
].map(normalizeOrigin);

const allowedOrigins = isProduction
  ? productionOrigins
  : [...productionOrigins, ...developmentOrigins];

const allowedOriginSet = new Set(allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) {
      if (isProduction) {
        return callback(new Error("Origin header is required"));
      }
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);
    if (allowedOriginSet.has(normalizedOrigin)) {
      return callback(null, true);
    }

    logger.warn(`[CORS] Blocked origin: ${normalizedOrigin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  optionsSuccessStatus: 204,
}));
app.use(morgan("combined", { stream: morganStream }));
app.use(securityHeaders);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(generalLimiter); // Apply global rate limit

// ===== Routes =====
app.use("/api/auth", authRoutes);

app.use("/api/finance", tiingoLimiter, financeChartRoutes); // chart
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/user", userRoutes);
app.use("/api", apiRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/ai", aiRoutes); // Dedicated AI endpoints (lazy-loaded)
app.use("/api/subscription", subscriptionRoutes); // Subscription Management
app.use("/api/stocks", stockRoutes); // US Stock Database
app.use("/api/transactions", transactionRoutes); // Transaction CRUD
app.use("/api/payment", paymentRoutes); // Paratika Payment Integration
app.use("/api/personal-finance", protect, personalFinanceRoutes); // Personal Finance PDF Upload
app.use("/api/admin", adminRoutes); // Admin Panel API

// Chats list endpoint (alias for /api/chat/history)
app.get("/api/chats", protect, getChatHistory);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// POST /api/contact — Contact form email

app.post("/api/contact", async (req, res) => {
  try {
    const { companyName, contactName, email, message, phone, employeeCount } = req.body;

    // Validation
    if (!contactName?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, message: "Zorunlu alanlar eksik (isim, e-posta, mesaj)." });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Geçerli bir e-posta adresi girin." });
    }

    await sendContactEmail({ companyName, contactName, email, phone, employeeCount, message });
    res.json({ success: true, message: "Mesajınız başarıyla iletildi!" });
  } catch (error) {
    console.error("[Contact] Email error:", error.message);
    res.status(500).json({ success: false, message: "Mail gönderilemedi, lütfen tekrar deneyin." });
  }
});

// ===== PRODUCTION: Static File Serving =====
if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Serve frontend build files
  app.use(express.static(path.join(__dirname, '../../frontend/build')));

  // Handle React routing - send all non-API requests to index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
  });
}

// Root Route (Development only)
if (process.env.NODE_ENV !== 'production') {
  app.get("/", (req, res) => {
    res.send("🚀 FinBot API is running correctly on port " + (process.env.PORT || 5000));
  });
}

// ===== Error Handling (MUST BE LAST) =====
app.use(notFoundHandler);
app.use(errorHandler);

// ===== DB Connection =====
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  logger.error("❌ FATAL: MONGO_URI is not defined in .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    logger.info("✅ MongoDB Connected!");

    // === ONE-TIME FIX: Drop stale 'username' unique index ===
    // The 'username' field was deprecated (no longer required), but the old
    // unique index remains in MongoDB. This causes E11000 duplicate key errors
    // when multiple users register without a username (null values collide).
    try {
      const usersCollection = mongoose.connection.collection("users");
      const indexes = await usersCollection.indexes();
      const usernameIndex = indexes.find(idx => idx.key?.username !== undefined && idx.unique === true);
      if (usernameIndex) {
        await usersCollection.dropIndex(usernameIndex.name);
        logger.info(`🗑️ Dropped stale unique index: ${usernameIndex.name}`);
      }
    } catch (idxErr) {
      // Not critical — index may already be gone
      if (!idxErr.message?.includes("not found")) {
        logger.warn(`⚠️ Index cleanup warning: ${idxErr.message}`);
      }
    }

    // Seed initial stocks if database is empty
    await seedInitialStocks();

    // Start background job to cache fundamentals every 6 hours
    startFundamentalsCacheJob();

    // Start Paratika payment verification cron
    initPaymentCron();

    // Start subscription renewal cron (daily at midnight)
    initSubscriptionCron();
  })
  .catch((e) => {
    logger.error(`❌ MongoDB Connection Error: ${e.message}`);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  });

// ===== Graceful Shutdown =====
process.on("SIGTERM", () => {
  logger.info("🛑 SIGTERM received. Shutting down gracefully...");
  mongoose.connection.close(false, () => {
    logger.info("📦 MongoDB connection closed.");
    process.exit(0);
  });
});


// ===== Start Server =====
const PORT = process.env.PORT || 5000;

// Only start server if not in test mode AND not running in AWS Lambda
// When deployed to Lambda, serverless-http handles the HTTP processing
const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

if (process.env.NODE_ENV !== 'test' && !isLambda) {
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📋 Environment: ${process.env.NODE_ENV || "development"}`);
    logger.info(`🔒 Rate limiting: Enabled`);
  });
} else if (isLambda) {
  logger.info(`🔷 Running in AWS Lambda mode`);
  logger.info(`📋 Environment: ${process.env.NODE_ENV || "production"}`);
}

export default app;



