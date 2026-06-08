import express from "express";
import {
  getActiveBanners,
  getAllBannersAdmin,
  addBanner,
  updateBanner,
  deleteBanner
} from "../controllers/bannerController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// Public routes
router.get("/", getActiveBanners);

// Admin routes
router.get("/admin", protect, adminOnly, getAllBannersAdmin);
router.post("/admin", protect, adminOnly, upload.single("image"), addBanner);
router.put("/admin/:id", protect, adminOnly, upload.single("image"), updateBanner);
router.delete("/admin/:id", protect, adminOnly, deleteBanner);

export default router;
