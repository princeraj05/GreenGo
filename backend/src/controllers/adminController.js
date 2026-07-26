import User from "../models/User.js";
import Order from "../models/Order.js";
import Food from "../models/Food.js";

export const getAdminStats = async (req, res) => {
  try {
    const users = await User.countDocuments({ role: "customer" });
    const orders = await Order.countDocuments({ status: { $ne: "PaymentPending" } });
    const foods = await Food.countDocuments();

    const revenueAgg = await Order.aggregate([
      { $match: { status: "Delivered" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    const revenue = revenueAgg[0]?.total || 0;

    res.json({
      users,
      orders,
      foods,
      revenue,
    });
  } catch (err) {
    res.status(500).json({ message: "Dashboard error" });
  }
};
