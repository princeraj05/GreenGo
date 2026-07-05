import express from "express";
import { createNotification, getAllNotifications, getMyNotifications, markAsRead, updateNotification, deleteNotification } from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/", protect, adminOnly, createNotification);
router.get("/all", protect, adminOnly, getAllNotifications);
router.get("/my", protect, getMyNotifications);
router.put("/read-all", protect, markAsRead); // Mark all as read endpoint
router.put("/:id/read", protect, markAsRead);
router.put("/:id", protect, adminOnly, updateNotification);
router.delete("/:id", protect, adminOnly, deleteNotification);

export default router;
