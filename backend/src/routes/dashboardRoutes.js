import express from "express";
import {
  getUserStats,
  getRecommendedFoods,
  getFeaturedFood,
  getActiveOffers
} from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/user-stats", protect, getUserStats);
router.get("/recommended", getRecommendedFoods); // Open or protected based on requirements
router.get("/featured-food", getFeaturedFood);
router.get("/offers", getActiveOffers);

export default router;
