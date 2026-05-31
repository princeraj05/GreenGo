import express from "express";
import { createNotification, getAllNotifications, getMyNotifications, markAsRead } from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/", protect, adminOnly, createNotification);
router.get("/all", protect, adminOnly, getAllNotifications);
router.get("/my", protect, getMyNotifications);
router.put("/:id/read", protect, markAsRead);

export default router;
