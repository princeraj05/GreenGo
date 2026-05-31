import Order from "../models/Order.js";
import User from "../models/User.js";
import Food from "../models/Food.js";

/* ================= DASHBOARD ANALYTICS ================= */
export const getDashboardStats = async (req, res) => {
  try {
    const [totalOrders, totalCustomers, totalFoods, pendingOrders, deliveredOrders] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments(),
      Food.countDocuments(),
      Order.countDocuments({ status: "Pending" }),
      Order.countDocuments({ status: "Delivered" })
    ]);

    const result = await Order.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: "$total" } } }
    ]);
    const totalRevenue = result[0]?.totalRevenue || 0;

    // Charts Data
    const revenueByMonth = await Order.aggregate([
      { $match: { status: "Delivered" } },
      { $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$total" }
      }},
      { $sort: { "_id": 1 } }
    ]);

    const ordersByDay = await Order.aggregate([
      { $group: {
          _id: { $dayOfWeek: "$createdAt" },
          orders: { $sum: 1 }
      }},
      { $sort: { "_id": 1 } }
    ]);

    const topFoods = await Food.find().sort({ totalOrders: -1 }).limit(5).select("name totalOrders");

    res.json({
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalFoods,
      pendingOrders,
      deliveredOrders,
      chartData: {
        revenueByMonth,
        ordersByDay,
        topFoods
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= FOOD ANALYTICS ================= */
export const getFoodAnalytics = async (req, res) => {
  try {
    const foods = await Food.find().select("name totalOrders revenueGenerated ratingCount popularityScore featured").sort({ revenueGenerated: -1 });
    res.json(foods);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
