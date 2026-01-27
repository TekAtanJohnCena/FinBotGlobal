// PATH: backend/src/routes/chatRoutes.js
import express from "express";
import {
  sendMessage,
  getChatHistory,
  getChatById,
  renameChat,
  deleteChat,
} from "../controllers/chatController.js";

// Security Middleware imports
import { protect } from "../middleware/auth.js";
import { aiRateLimiter } from "../middleware/security.js";
import { validate, chatMessageSchema } from "../middleware/validate.js";
import { checkFinbotQuota } from "../middleware/quotaMiddleware.js";

const router = express.Router();

// All routes require authentication
// Note: This router is mounted at "/api/chat" in index.js
// POST /api/chat -> sendMessage (mesaj gönder)
router.post("/", protect, checkFinbotQuota, aiRateLimiter, validate(chatMessageSchema), sendMessage);
// GET /api/chat/history -> getChatHistory (geçmiş sohbetler)
router.get("/history", protect, getChatHistory);
// GET /api/chat/:chatId -> getChatById (tek sohbet detayı)
router.get("/:chatId", protect, getChatById);
// PUT /api/chat/:chatId/rename -> renameChat
router.put("/:chatId/rename", protect, renameChat);
// DELETE /api/chat/:chatId -> deleteChat
router.delete("/:chatId", protect, deleteChat);

export default router;