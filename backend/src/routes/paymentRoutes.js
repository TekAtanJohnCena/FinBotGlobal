import express from "express";
import { createPayment, handleCallback, queryPayment, validatePromoCode } from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Create payment session (requires auth)
router.post("/create", protect, createPayment);

// Validate promo code
router.post("/validate-promo", protect, validatePromoCode);

// Paratika callback — supports both POST (form data) and GET (redirect)
router.post("/callback", handleCallback);
router.get("/callback", handleCallback);

// Query transaction status (requires auth)
router.get("/query/:merchantPaymentId", protect, queryPayment);

export default router;
