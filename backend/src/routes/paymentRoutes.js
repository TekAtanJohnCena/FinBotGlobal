import express from "express";
import { createPayment, handleCallback } from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/create", protect, createPayment);
router.post("/callback", handleCallback); // Public endpoint for Paratika POST

export default router;
