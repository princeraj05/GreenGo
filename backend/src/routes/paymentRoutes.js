import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createRazorpayOrder, verifyRazorpayPayment } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-order", protect, createRazorpayOrder);
router.post("/verify", protect, verifyRazorpayPayment);
router.get("/key", (req, res) => res.status(200).json({ key: process.env.RAZORPAY_KEY_ID }));

export default router;
