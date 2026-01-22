// PATH: backend/src/routes/userRoutes.js
import express from "express";
import { getUserProfile } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Get user profile (protected route)
router.get("/profile", protect, getUserProfile);

export default router;

