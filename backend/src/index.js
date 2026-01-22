// PATH: backend/src/index.js
/**
 * FinBot Backend - Main Entry Point
 * Production-ready with security middleware, rate limiting, and error handling
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

// SECURITY MIDDLEWARE
import { securityHeaders } from "./middleware/security.js";
import { generalLimiter, tiingoLimiter, authLimiter } from "./middleware/rateLimiter.js";
import morgan from "morgan";
import logger, { morganStream } from "./utils/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

// ROUTE IMPORTS
import authRoutes from "./routes/authRoutes.js";
import priceRoutes from "./routes/priceRoutes.js";
import financeRoutes from "./routes/finance.js";
import financeChartRoutes from "./routes/financeChart.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// ADDITIONAL IMPORTS for /api/chats endpoint
import { protect } from "./middleware/auth.js";
import { getChatHistory } from "./controllers/chatController.js";

const app = express();
app.set('trust proxy', 1);

// ===== Logging =====
app.use(morgan("combined", { stream: morganStream }));

// ===== Security Headers =====
app.use(securityHeaders);

// ===== Middleware =====
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use(generalLimiter); // Apply global rate limit

// ===== Routes =====
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/price", tiingoLimiter, priceRoutes);
app.use("/api/finance", tiingoLimiter, financeRoutes); // quote, profile
app.use("/api/finance", tiingoLimiter, financeChartRoutes); // chart
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/user", userRoutes);

// Chats list endpoint (alias for /api/chat/history)
app.get("/api/chats", protect, getChatHistory);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// Root Route
app.get("/", (req, res) => {
  res.send("🚀 FinBot API is running correctly on port " + (process.env.PORT || 3000));
});

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
  .then(() => logger.info("✅ MongoDB Connected!"))
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

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📋 Environment: ${process.env.NODE_ENV || "development"}`);
    logger.info(`🔒 Rate limiting: Enabled`);
  });
}

export default app;
