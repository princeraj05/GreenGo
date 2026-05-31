import express from "express";
import { createNotification, getAllNotifications, getMyNotifications, markAsRead } from "../controllers/notificationController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, admin, createNotification);
router.get("/all", protect, admin, getAllNotifications);
router.get("/my", protect, getMyNotifications);
router.put("/:id/read", protect, markAsRead);

export default router;
