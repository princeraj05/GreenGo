import Coupon from "../models/Coupon.js";

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
