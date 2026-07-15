import express from "express";
import rateLimit from "express-rate-limit";
import { protect } from "../middleware/authMiddleware.js";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook
} from "../controllers/paymentController.js";

const router = express.Router();

// Rate limiting configurations for security
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 payment requests per window
  message: { success: false, message: "Too many requests. Please try again after 15 minutes." }
});

const webhookLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 150, // Authoritative webhook requests limit
  message: { success: false, message: "Too many webhook requests." }
});

router.post("/create-order", protect, paymentLimiter, createRazorpayOrder);
router.post("/verify", protect, paymentLimiter, verifyRazorpayPayment);
router.post("/webhook", webhookLimiter, handleRazorpayWebhook);
router.get("/key", (req, res) => res.status(200).json({ key: process.env.RAZORPAY_KEY_ID }));

export default router;
