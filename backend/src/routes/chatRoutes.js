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

const router = express.Router();

// All routes require authentication
router.post("/chat", protect, aiRateLimiter, validate(chatMessageSchema), sendMessage);
router.get("/chat/history", protect, getChatHistory);
router.get("/chats", protect, getChatHistory);
router.get("/chat/:id", protect, getChatById);
router.put("/chat/:id/rename", protect, renameChat);
router.delete("/chat/:id", protect, deleteChat);

export default router;