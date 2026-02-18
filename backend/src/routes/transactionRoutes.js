// PATH: backend/src/routes/transactionRoutes.js
// CRUD routes for individual transactions
import express from "express";
import { protect } from "../middleware/auth.js";
import {
    getTransactions,
    addTransaction,
    deleteTransaction,
    clearTransactions,
} from "../controllers/transactionController.js";

const router = express.Router();
router.use(protect);

// GET /api/transactions - Get all transactions for user
router.get("/", getTransactions);

// POST /api/transactions - Add a single transaction
router.post("/", addTransaction);

// DELETE /api/transactions/clear - Clear ALL transactions for user (must be before /:id)
router.delete("/clear", clearTransactions);

// DELETE /api/transactions/:id - Delete a single transaction
router.delete("/:id", deleteTransaction);

export default router;
