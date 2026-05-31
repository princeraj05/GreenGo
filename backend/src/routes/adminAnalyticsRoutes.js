import express from "express";
import { getDashboardStats, getFoodAnalytics } from "../controllers/adminAnalyticsController.js";
import verifyFirebaseToken from "../middleware/firebaseAuth.js";
import checkAdmin from "../middleware/roleCheck.js";

const router = express.Router();

router.get("/dashboard-stats", verifyFirebaseToken, checkAdmin, getDashboardStats);
router.get("/food-analytics", verifyFirebaseToken, checkAdmin, getFoodAnalytics);

export default router;
