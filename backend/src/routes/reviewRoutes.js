import express from "express";
import {
  createReview,
  getReviews,
  getReviewsByFood,
  updateReview,
  deleteReview,
  toggleReviewVisibility,
} from "../controllers/reviewController.js";
import { protect, optionalProtect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Public or optionally authenticated reviews lists
router.get("/", optionalProtect, getReviews);

// Public specific food reviews list
router.get("/food/:foodId", getReviewsByFood);

// Authenticated user reviews endpoints
router.post("/", protect, createReview);
router.put("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);

// Admin review moderation endpoint
router.patch("/:id/visibility", protect, adminOnly, toggleReviewVisibility);

export default router;
