import User from "../models/User.js";
import Food from "../models/Food.js";
import Coupon from "../models/Coupon.js";

/* ================= USER STATS ================= */
export const getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("totalOrders totalSpent rewardPoints favoriteCategory");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= RECOMMENDED FOODS ================= */
export const getRecommendedFoods = async (req, res) => {
  try {
    // Basic recommendation logic: return top ordered or highest rating foods
    const recommended = await Food.find().sort({ totalOrders: -1, popularityScore: -1 }).limit(4);
    res.json(recommended);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= FEATURED FOOD ================= */
export const getFeaturedFood = async (req, res) => {
  try {
    const featured = await Food.findOne({ featured: true }).sort({ updatedAt: -1 });
    res.json(featured || null);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= ACTIVE OFFERS ================= */
export const getActiveOffers = async (req, res) => {
  try {
    const activeCoupons = await Coupon.find({ 
      active: true, 
      expiryDate: { $gte: new Date() },
      $or: [
        { referrerId: null },
        { referrerId: { $exists: false } }
      ]
    }).lean();

    let filteredCoupons = activeCoupons;
    if (req.user && req.user.id) {
      const Order = (await import("../models/Order.js")).default;
      const hasUsedNew50 = await Order.exists({
        userId: req.user.id,
        couponCode: { $regex: /^NEW50$/i }
      });
      if (hasUsedNew50) {
        filteredCoupons = activeCoupons.filter(c => c.code.toUpperCase() !== "NEW50");
      }
    }

    // Prepend dynamic birthday coupon if birthday is today and enabled
    const Settings = (await import("../models/Settings.js")).default;
    const settings = await Settings.findOne();
    if (settings && settings.isBirthdayOfferEnabled && req.user && req.user.id) {
      const user = await User.findById(req.user.id);
      if (user && user.birthDate) {
        const today = new Date();
        const birthDate = new Date(user.birthDate);
        const isBirthdayToday = today.getMonth() === birthDate.getMonth() && today.getDate() === birthDate.getDate();
        if (isBirthdayToday) {
          const Order = (await import("../models/Order.js")).default;
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          const endOfToday = new Date();
          endOfToday.setHours(23, 59, 59, 999);

          const priorUses = await Order.countDocuments({
            userId: req.user.id,
            couponCode: "BIRTHDAY",
            createdAt: { $gte: startOfToday, $lte: endOfToday },
            paymentStatus: { $in: ["Paid", "Pending"] },
            status: { $nin: ["Cancelled", "PaymentPending"] }
          });

          if (priorUses === 0) {
            const bdayCoupon = {
              _id: "virtual-birthday-coupon",
              title: "🎂 Birthday Special Offer",
              code: "BIRTHDAY",
              discountType: "flat",
              discountValue: settings.birthdayCouponAmount || 50,
              minimumOrder: settings.minOrderAmount || 0,
              expiryDate: endOfToday,
              active: true,
              isBirthday: true
            };
            filteredCoupons = [bdayCoupon, ...filteredCoupons];
          }
        }
      }
    }

    res.json(filteredCoupons);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
