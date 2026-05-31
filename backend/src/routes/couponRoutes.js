import express from "express";
import { createCoupon, getAllCoupons, updateCoupon, deleteCoupon } from "../controllers/couponController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, admin, createCoupon);
router.get("/", protect, admin, getAllCoupons);
router.put("/:id", protect, admin, updateCoupon);
router.delete("/:id", protect, admin, deleteCoupon);

export default router;
