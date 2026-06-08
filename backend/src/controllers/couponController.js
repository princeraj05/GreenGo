import Coupon from "../models/Coupon.js";
import Notification from "../models/Notification.js";

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
    
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    
    if (!coupon || !coupon.active) {
      return res.status(400).json({ message: "Invalid or inactive promo code." });
    }
    
    if (new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ message: "This promo code has expired." });
    }
    
    if (cartTotal < coupon.minimumOrder) {
      return res.status(400).json({ message: `Minimum order amount of ₹${coupon.minimumOrder} is required.` });
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

/* ================= GET ACTIVE COUPONS (USER) ================= */
export const getActiveCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ active: true, expiryDate: { $gt: new Date() } }).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
