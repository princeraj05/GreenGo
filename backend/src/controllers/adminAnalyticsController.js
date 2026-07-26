import Order from "../models/Order.js";
import User from "../models/User.js";
import Food from "../models/Food.js";

/* ================= DASHBOARD ANALYTICS ================= */
export const getDashboardStats = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);
    const todayQuery = { createdAt: { $gte: startOfToday, $lt: endOfToday } };

    const [
      totalOrders,
      totalCustomers,
      totalFoods,
      pendingOrders,
      deliveredOrders,
      totalCancelledOrders,
      todayOrders,
      todayPendingOrders,
      todayPreparingOrders,
      todayOutForDeliveryOrders,
      todayDeliveredOrders,
      todayCancelledOrders,
    ] = await Promise.all([
      Order.countDocuments({ status: { $ne: "PaymentPending" } }),
      User.countDocuments(),
      Food.countDocuments(),
      Order.countDocuments({ status: "Pending" }),
      Order.countDocuments({ status: "Delivered" }),
      Order.countDocuments({ status: "Cancelled" }),
      Order.countDocuments({ ...todayQuery, status: { $ne: "PaymentPending" } }),
      Order.countDocuments({ ...todayQuery, status: "Pending" }),
      Order.countDocuments({ ...todayQuery, status: "Preparing" }),
      Order.countDocuments({ ...todayQuery, status: { $in: ["Out for Delivery", "AcceptedByDeliveryBoy"] } }),
      Order.countDocuments({ ...todayQuery, status: "Delivered" }),
      Order.countDocuments({ ...todayQuery, status: "Cancelled" }),
    ]);

    const result = await Order.aggregate([
      { $match: { status: { $ne: "PaymentPending" } } },
      { $group: { _id: null, totalRevenue: { $sum: "$total" } } }
    ]);
    const totalRevenue = result[0]?.totalRevenue || 0;
    const todayRevenueResult = await Order.aggregate([
      { $match: { ...todayQuery, status: { $nin: ["Cancelled", "PaymentPending"] } } },
      { $group: { _id: null, totalRevenue: { $sum: "$total" } } }
    ]);
    const todayRevenue = todayRevenueResult[0]?.totalRevenue || 0;

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

    const topFoods = await Food.find().sort({ totalOrders: -1 }).limit(5).select("name totalOrders").lean();
    const activeDeliveryOrders = await Order.find({
      assignedDeliveryBoy: { $ne: null },
      status: { $nin: ["Delivered", "Cancelled", "RejectedByDeliveryBoy"] },
    })
      .populate("assignedDeliveryBoy", "name phone email deliveryDetails address")
      .sort({ updatedAt: -1 })
      .lean();

    const activeDeliveryBoysMap = new Map();
    activeDeliveryOrders.forEach((order) => {
      const rider = order.assignedDeliveryBoy;
      if (!rider?._id || activeDeliveryBoysMap.has(String(rider._id))) return;
      const tracked = order.tracking?.riderLocation;
      activeDeliveryBoysMap.set(String(rider._id), {
        id: rider._id,
        name: rider.name || "Delivery Boy",
        phone: rider.phone || "",
        email: rider.email || "",
        orderId: order._id,
        orderStatus: order.status,
        location: tracked?.lat !== undefined && tracked?.lng !== undefined
          ? { lat: tracked.lat, lng: tracked.lng, updatedAt: tracked.updatedAt, source: "live" }
          : {
              lat: rider.deliveryDetails?.latitude ?? null,
              lng: rider.deliveryDetails?.longitude ?? null,
              address: rider.deliveryDetails?.address || rider.address || "",
              updatedAt: rider.deliveryDetails?.updatedAt || order.updatedAt,
              source: "profile",
            },
      });
    });

    res.json({
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalFoods,
      pendingOrders,
      deliveredOrders,
      totalCancelledOrders,
      today: {
        orders: todayOrders,
        revenue: todayRevenue,
        pendingOrders: todayPendingOrders,
        preparingOrders: todayPreparingOrders,
        outForDeliveryOrders: todayOutForDeliveryOrders,
        deliveredOrders: todayDeliveredOrders,
        cancelledOrders: todayCancelledOrders,
      },
      activeDeliveryBoys: Array.from(activeDeliveryBoysMap.values()),
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
    const foods = await Food.find().select("name totalOrders revenueGenerated ratingCount popularityScore featured").sort({ revenueGenerated: -1 }).lean();
    res.json(foods);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
