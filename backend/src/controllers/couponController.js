import Coupon from "../models/Coupon.js";
import Notification from "../models/Notification.js";
import { sendPushToAllUsers } from "../utils/pushNotification.js";

/* ================= CREATE COUPON ================= */
export const createCoupon = async (req, res) => {
  try {
    const { title, code, discountType, discountValue, minimumOrder, expiryDate, active } = req.body;
    
    const existing = await Coupon.findOne({ code });
    if (existing) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    const coupon = await Coupon.create({
      title,
      code,
      discountType,
      discountValue,
      minimumOrder,
      expiryDate,
      active
    });

    if (active !== false) {
      await Notification.create({
        title: "New coupon available",
        message: `${title || "New promo code"} is live. Use code ${String(code || "").toUpperCase()} and save on your next order.`,
        type: "success",
      });
      sendPushToAllUsers(
        "New coupon available",
        `${title || "New promo code"} is live. Use code ${String(code || "").toUpperCase()} and save on your next order.`,
        { code: String(code || "") }
      );
    }

    res.json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET ALL COUPONS ================= */
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE COUPON ================= */
export const updateCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    const updateData = req.body;
    
    const coupon = await Coupon.findByIdAndUpdate(couponId, updateData, { new: true });
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    res.json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= DELETE COUPON ================= */
export const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    const coupon = await Coupon.findByIdAndDelete(couponId);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    res.json({ success: true, message: "Coupon deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= VALIDATE COUPON ================= */
export const validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    const cleanCode = String(code || "").trim().toUpperCase();
    
    const coupon = await Coupon.findOne({ code: cleanCode });
    
    if (!coupon || !coupon.active) {
      return res.status(400).json({ message: "Invalid or inactive promo code." });
    }

    // Check user locking
    if (coupon.userId && req.user && String(coupon.userId) !== String(req.user.id)) {
      return res.status(400).json({ message: "This coupon code does not belong to you." });
    }
    
    if (new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ message: "This promo code has expired." });
    }
    
    if (cartTotal < coupon.minimumOrder) {
      return res.status(400).json({ message: `Minimum order amount of ₹${coupon.minimumOrder} is required.` });
    }

    // Referral coupon validation check
    const isReferral = (coupon.title && coupon.title.includes("Referral")) || coupon.referrerId != null || coupon.code.endsWith("25");
    if (isReferral && req.user && req.user.id) {
      // 1. Prevent using own referral code
      if (coupon.referrerId && String(coupon.referrerId) === String(req.user.id)) {
        return res.status(400).json({ message: "You cannot use your own referral code." });
      }

      const User = (await import("../models/User.js")).default;
      const currentUser = await User.findById(req.user.id);
      if (currentUser) {
        const source = currentUser.name || currentUser.phone || currentUser.email || "GREENGO";
        const cleanSource = source.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase() || "GREEN";
        
        // Fallback suffix support (based on admin setting or legacy 25)
        const Settings = (await import("../models/Settings.js")).default;
        const settings = await Settings.findOne();
        const rewardFriend = settings?.referralRewardFriend || 50;
        
        if (cleanCode === `${cleanSource}${rewardFriend}` || cleanCode === `${cleanSource}25`) {
          return res.status(400).json({ message: "You cannot use your own referral code." });
        }
      }

      // 2. Prevent using referral coupon on repeat orders (first order only)
      const Order = (await import("../models/Order.js")).default;
      const orderCount = await Order.countDocuments({ userId: req.user.id });
      if (orderCount > 0) {
        return res.status(400).json({ message: "Referral coupons are only valid for your first order." });
      }
    }
    
    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getActiveCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({
      active: true,
      expiryDate: { $gt: new Date() },
      $or: [
        { referrerId: null },
        { referrerId: { $exists: false } }
      ]
    }).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
