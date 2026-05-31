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
    const activeCoupons = await Coupon.find({ active: true, expiryDate: { $gte: new Date() } });
    res.json(activeCoupons);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
