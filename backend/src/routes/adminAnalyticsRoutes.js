import express from "express";
import { getDashboardStats, getFoodAnalytics } from "../controllers/adminAnalyticsController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/dashboard-stats", protect, adminOnly, getDashboardStats);
router.get("/food-analytics", protect, adminOnly, getFoodAnalytics);

export default router;
