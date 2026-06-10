import express from "express";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Food from "../models/Food.js";
import Contact from "../models/Contact.js";

const router = express.Router();

/* ================= ADMIN DASHBOARD STATS ================= */

router.get("/stats", async (req, res) => {
  try {

    const users = await User.countDocuments();
    const orders = await Order.countDocuments();
    const foods = await Food.countDocuments();

    const revenueAgg = await Order.aggregate([
      { $match: { status: "Delivered" } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]);

    const revenue = revenueAgg[0]?.total || 0;

    const cancelledOrders = await Order.countDocuments({ status: "Cancelled" });

    res.json({
      users,
      orders,
      foods,
      revenue,
      cancelledOrders
    });

  } catch (err) {

    console.error("Admin dashboard error:", err);

    res.status(500).json({
      message: "Server error"
    });

  }
});

/* ================= UNREAD ALERTS ================= */
router.get("/unread-alerts", async (req, res) => {
  try {
    const unreadContacts = await Contact.countDocuments({ 
      $or: [ { reply: { $exists: false } }, { reply: "" }, { reply: null } ] 
    });
    res.json({ unreadContacts });
  } catch (err) {
    console.error("Unread alerts error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;