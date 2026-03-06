import express from "express";
import { protect } from "../middleware/auth.js";
import { adminProtect } from "../middleware/adminAuth.js";
import {
    getDashboardMetrics,
    getUsersList,
    getTransactionsList,
    createPromoCode,
    getPromoCodes,
    togglePromoCode,
    updateUserSubscription
} from "../controllers/adminController.js";

const router = express.Router();

// Apply middleware to all routes in this file
router.use(protect);
router.use(adminProtect);

// Dashboard Metrics
router.get("/metrics", getDashboardMetrics);

// User Management
router.get("/users", getUsersList);
router.patch("/users/:id/subscription", updateUserSubscription);

// Transaction History
router.get("/transactions", getTransactionsList);

// Promo Code Management
router.post("/promos", createPromoCode);
router.get("/promos", getPromoCodes);
router.patch("/promos/:id/toggle", togglePromoCode); // Using PATCH / PUT

export default router;
