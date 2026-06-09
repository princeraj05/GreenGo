import Order from "../models/Order.js";
import Settings from "../models/Settings.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Food from "../models/Food.js";
import { createAdminNotification, formatPaymentMethod, orderCode } from "../services/adminNotificationService.js";

const isAdmin = (user) => user?.role === "admin";
const isDeliveryBoy = (user) => user?.role === "deliveryBoy";
const isCodPayment = (method = "") => String(method).toLowerCase() === "cod";
const toObjectIdString = (value) => value ? String(value._id || value) : "";
const isDeliveryProfileComplete = (user) => Boolean(
  user?.deliveryDetails?.profileCompleted &&
  String(user?.name || "").trim() &&
  String(user?.phone || "").trim() &&
  String(user?.deliveryDetails?.address || user?.address || "").trim()
);

const requireDeliveryProfile = async (req, res) => {
  if (!isDeliveryBoy(req.user)) {
    res.status(403).json({ message: "Not delivery boy" });
    return null;
  }
  const user = await User.findById(req.user.id).select("name phone address role deliveryDetails deliveryCredit");
  if (!user) {
    res.status(404).json({ message: "Delivery boy not found" });
    return null;
  }
  if (!isDeliveryProfileComplete(user)) {
    res.status(403).json({
      code: "DELIVERY_PROFILE_INCOMPLETE",
      message: "Complete your delivery profile before viewing assigned orders.",
      requiredFields: ["name", "phone", "address"],
    });
    return null;
  }
  return user;
};

const canViewTracking = (order, user) => {
  if (isAdmin(user)) return true;
  if (String(order.userId) === String(user?.id)) return true;
  if (isDeliveryBoy(user) && toObjectIdString(order.assignedDeliveryBoy) === String(user?.id)) return true;
  return false;
};

const buildTrackingResponse = (order) => ({
  orderId: order._id,
  status: order.status,
  customerLocation: {
    address: order.address || "",
    lat: order.latitude ?? null,
    lng: order.longitude ?? null
  },
  riderLocation: order.tracking?.riderLocation?.lat !== undefined && order.tracking?.riderLocation?.lng !== undefined
    ? {
        lat: order.tracking.riderLocation.lat,
        lng: order.tracking.riderLocation.lng,
        updatedAt: order.tracking.riderLocation.updatedAt
      }
    : null,
  updatedAt: order.tracking?.riderLocation?.updatedAt || order.updatedAt
});

const addDeliveredStats = async (order) => {
  const user = await User.findById(order.userId);
  if (user) {
    user.totalOrders = (user.totalOrders || 0) + 1;
    user.totalSpent = (user.totalSpent || 0) + order.total;
    user.rewardPoints = (user.rewardPoints || 0) + Math.floor(order.total / 10);
    await user.save();
  }

  for (const item of order.items) {
    await Food.findByIdAndUpdate(item.foodId, {
      $inc: { totalOrders: item.qty, revenueGenerated: item.price * item.qty }
    });
  }
};

const creditDeliveryBoyForCod = async (order) => {
  if (!order.assignedDeliveryBoy || !isCodPayment(order.paymentMethod)) return;
  await User.findByIdAndUpdate(order.assignedDeliveryBoy, {
    $inc: { deliveryCredit: Number(order.total || 0) }
  });
};

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const geocodeAddress = async (addrStr) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addrStr)}&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "GreenGo-FoodDelivery-App/1.0" }
    });
    const data = await res.json();
    if (data && data.length > 0) {
      return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
    }
  } catch (err) {
    console.error("Geocoding failed on backend:", err);
  }
  return null;
};

/* ================= CREATE ORDER (USER) ================= */
export const createOrder = async (req, res) => {
  try {

    const {
      items,
      address,
      phone,
      paymentMethod,
      subtotal,
      deliveryCharge,
      total,
      latitude,
      longitude,
      customMessage
    } = req.body;

    let userLat = latitude;
    let userLon = longitude;

    // If coordinates are not provided, try to geocode the address
    if ((userLat === undefined || userLat === null) && address) {
      const coords = await geocodeAddress(address);
      if (coords) {
        userLat = coords.latitude;
        userLon = coords.longitude;
      }
    }

    let distance = null;
    const settings = await Settings.findOne();
    if (settings && userLat !== undefined && userLat !== null && userLon !== undefined && userLon !== null) {
      distance = calculateHaversineDistance(
        settings.storeLatitude,
        settings.storeLongitude,
        userLat,
        userLon
      );

      // Verify delivery distance limit if enabled
      if (settings.isDistanceLimitEnabled && distance > settings.maxDeliveryDistance) {
        return res.status(400).json({
          message: `Delivery is not available. Your location is ${distance.toFixed(1)} km away, which exceeds our maximum delivery distance of ${settings.maxDeliveryDistance} km.`
        });
      }
    }

    const order = await Order.create({
      userId: req.user.id,

      items: items.map(i => ({
        foodId: i._id,
        name: i.name,
        price: i.price,
        packingCharge: Number(i.packingCharge || 0),
        qty: i.qty,
        image: i.image
      })),

      address,
      phone,
      paymentMethod,
      subtotal,
      deliveryCharge,
      total,
      distance: distance ? Number(distance.toFixed(2)) : null,
      latitude: userLat,
      longitude: userLon,
      customMessage: customMessage || ""
    });

    await Notification.create({
      userId: req.user.id,
      title: "Order placed",
      message: `Your order #${orderCode(order._id)} has been placed successfully.`,
      type: "success",
    });

    const customer = await User.findById(req.user.id).select("name email phone");
    await createAdminNotification({
      title: "New Order Placed",
      message: `Order #${orderCode(order._id)} | ${formatPaymentMethod(paymentMethod)} | Total ₹${Number(total || 0)} | ${customer?.name || "Customer"} | ${customer?.email || "N/A"} | ${phone || customer?.phone || "N/A"}`,
      type: isCodPayment(paymentMethod) ? "warning" : "success",
      actionPath: "/admin/orders",
      data: {
        event: "new_order",
        orderId: String(order._id),
        userId: String(req.user.id),
        paymentMethod: formatPaymentMethod(paymentMethod),
        total,
      },
    });

    res.json({
      success:true,
      order
    });

  } catch (err) {

    console.error("Create order error:",err);

    res.status(500).json({
      message:"Order failed"
    });

  }
};


/* ================= ADMIN – ALL ORDERS ================= */

export const getAllOrders = async (req,res)=>{
  if (!isAdmin(req.user)) return res.status(403).json({ message: "Not admin" });
  const orders = await Order
  .find()
  .populate("assignedDeliveryBoy", "name phone email role deliveryCredit")
  .sort({createdAt:-1})
  .lean();

  res.json(orders);
};


/* ================= USER – MY ORDERS ================= */

export const getMyOrders = async (req,res)=>{

  const orders = await Order
  .find({userId:req.user.id})  // ✅ FIX
  .sort({createdAt:-1})
  .lean();

  res.json(orders);

};

/* ================= TRACKING ================= */

export const getOrderTracking = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).select(
      "userId status address latitude longitude assignedDeliveryBoy tracking updatedAt"
    ).lean();
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!canViewTracking(order, req.user)) return res.status(403).json({ message: "Not authorized to view tracking" });

    res.json(buildTrackingResponse(order));
  } catch (err) {
    console.error("Get tracking error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateRiderLocation = async (req, res) => {
  try {
    if (!isDeliveryBoy(req.user)) return res.status(403).json({ message: "Not delivery boy" });

    const lat = Number(req.body.lat);
    const lng = Number(req.body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ message: "Valid lat and lng are required" });
    }

    const order = await Order.findOne({ _id: req.params.id, assignedDeliveryBoy: req.user.id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === "Delivered") return res.status(400).json({ message: "Order already delivered" });

    order.tracking = {
      ...(order.tracking || {}),
      riderLocation: {
        lat,
        lng,
        updatedAt: new Date()
      }
    };
    await order.save();

    res.json({ success: true, tracking: order.tracking });
  } catch (err) {
    console.error("Update rider location error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/* ================= UPDATE STATUS ================= */

export const updateOrderStatus = async (req,res)=>{

  const {status,etaMinutes} = req.body;
  const orderId = req.params.id;

  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Not admin" });
    const order = await Order.findById(orderId);
    if(!order) return res.status(404).json({message:"Order not found"});
    const previousStatus = order.status;

    // Only apply stats when transitioning to Delivered
    if (status === "Delivered" && order.status !== "Delivered") {
      await addDeliveredStats(order);
      await creditDeliveryBoyForCod(order);
    }

    const update = {status};
    if(status!=="Delivered" && etaMinutes){
      update.etaMinutes = etaMinutes;
      update.etaSetAt = new Date();
    }
    if(status==="Delivered"){
      update.etaMinutes = null;
      update.etaSetAt = null;
      update.deliveredAt = new Date();
      update.assignmentStatus = order.assignedDeliveryBoy ? "Delivered" : order.assignmentStatus;
    }

    await Order.findByIdAndUpdate(orderId, update);

    if (status && status !== previousStatus) {
      const statusMessages = {
        Pending: "Your order is pending confirmation.",
        Preparing: "Your order is now being prepared.",
        "Out for Delivery": "Your order is out for delivery.",
        Delivered: "Your order has been delivered. Enjoy your meal!",
      };

      await Notification.create({
        userId: order.userId,
        title: `Order ${status}`,
        message: `Order #${orderCode(order._id)}: ${statusMessages[status] || `Status changed to ${status}.`}`,
        type: status === "Delivered" ? "success" : "info",
      });

      if (status === "Delivered") {
        await createAdminNotification({
          title: "Order Delivered",
          message: `Order #${orderCode(order._id)} delivered by admin update | ${formatPaymentMethod(order.paymentMethod)} | Total ₹${Number(order.total || 0)}`,
          type: "success",
          actionPath: "/admin/orders",
          data: {
            event: "order_delivered",
            orderId: String(order._id),
            userId: String(order.userId),
            paymentMethod: formatPaymentMethod(order.paymentMethod),
            total: order.total,
          },
        });
      }
    }
    res.json({success:true});
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({message:"Server error"});
  }
};

export const getDeliveryBoys = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Not admin" });
    const users = await User.find({ role: "deliveryBoy", blocked: { $ne: true } })
      .select("name phone email role deliveryCredit createdAt")
      .sort({ name: 1, createdAt: -1 })
      .lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const assignDeliveryBoy = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Not admin" });
    const { deliveryBoyId } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const deliveryBoy = await User.findOne({ _id: deliveryBoyId, role: "deliveryBoy", blocked: { $ne: true } });
    if (!deliveryBoy) return res.status(404).json({ message: "Delivery boy not found" });

    const wasReassigned = Boolean(order.assignedDeliveryBoy) && String(order.assignedDeliveryBoy) !== String(deliveryBoyId);
    order.assignedDeliveryBoy = deliveryBoyId;
    order.assignedAt = new Date();
    order.assignmentStatus = "Assigned";
    order.rejectionReason = "";
    order.rejectedAt = null;
    await order.save();

    await Notification.create({
      userId: String(deliveryBoyId),
      title: wasReassigned ? "Order Reassigned" : "New Order Assigned",
      message: `Order #${orderCode(order._id)} has been assigned to you.`,
      type: "info",
    });

    res.json({ success: true, order });
  } catch (err) {
    console.error("Assign delivery boy error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getDeliveryDashboard = async (req, res) => {
  try {
    const user = await requireDeliveryProfile(req, res);
    if (!user) return;
    const assignedQuery = { assignedDeliveryBoy: req.user.id };
    const [orders] = await Promise.all([
      Order.find(assignedQuery).sort({ createdAt: -1 }).lean(),
    ]);

    const deliveredOrders = orders.filter((order) => order.status === "Delivered");
    const onlinePaidOrders = deliveredOrders.filter((order) => !isCodPayment(order.paymentMethod));
    const onlinePaymentAmount = onlinePaidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    res.json({
      totalAssignedOrders: orders.length,
      pendingOrders: orders.filter((order) => order.status !== "Delivered" && order.status !== "RejectedByDeliveryBoy").length,
      deliveredOrders: deliveredOrders.length,
      codEarnings: user?.deliveryCredit || 0,
      onlinePaidOrders: onlinePaidOrders.length,
      onlinePaymentAmount,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getAssignedOrders = async (req, res) => {
  try {
    const user = await requireDeliveryProfile(req, res);
    if (!user) return;
    const orders = await Order.find({ assignedDeliveryBoy: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const acceptAssignedOrder = async (req, res) => {
  try {
    const deliveryUser = await requireDeliveryProfile(req, res);
    if (!deliveryUser) return;
    const order = await Order.findOne({ _id: req.params.id, assignedDeliveryBoy: req.user.id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === "Delivered") return res.status(400).json({ message: "Order already delivered" });

    order.status = "AcceptedByDeliveryBoy";
    order.assignmentStatus = "Accepted";
    order.acceptedAt = new Date();
    await order.save();

    await Notification.create({
      userId: order.userId,
      title: "Delivery partner accepted",
      message: `Order #${orderCode(order._id)} has been accepted by your delivery partner.`,
      type: "info",
    });

    const deliveryBoy = await User.findById(req.user.id).select("name email phone");
    await createAdminNotification({
      title: "Delivery Boy Accepted Order",
      message: `${deliveryBoy?.name || "Delivery boy"} accepted order #${orderCode(order._id)} | ${formatPaymentMethod(order.paymentMethod)} | Phone: ${deliveryBoy?.phone || "N/A"}`,
      type: "info",
      actionPath: "/admin/orders",
      data: {
        event: "delivery_accept",
        orderId: String(order._id),
        deliveryBoyId: String(req.user.id),
        paymentMethod: formatPaymentMethod(order.paymentMethod),
      },
    });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const rejectAssignedOrder = async (req, res) => {
  try {
    const deliveryUser = await requireDeliveryProfile(req, res);
    if (!deliveryUser) return;
    const order = await Order.findOne({ _id: req.params.id, assignedDeliveryBoy: req.user.id });
    if (!order) return res.status(404).json({ message: "Order not found" });

    const reason = String(req.body.reason || "").trim();
    order.status = "RejectedByDeliveryBoy";
    order.assignmentStatus = "Rejected";
    order.rejectedAt = new Date();
    order.rejectionReason = reason;
    await order.save();

    await Notification.create({
      title: "Order rejected by delivery boy",
      message: `Order #${orderCode(order._id)} was rejected${reason ? `: ${reason}` : "."}`,
      type: "warning",
    });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const markAssignedOrderDelivered = async (req, res) => {
  try {
    const deliveryUser = await requireDeliveryProfile(req, res);
    if (!deliveryUser) return;
    const order = await Order.findOne({ _id: req.params.id, assignedDeliveryBoy: req.user.id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === "Delivered") return res.json({ success: true, order });

    await addDeliveredStats(order);
    await creditDeliveryBoyForCod(order);

    order.status = "Delivered";
    order.assignmentStatus = "Delivered";
    order.deliveredAt = new Date();
    order.etaMinutes = null;
    order.etaSetAt = null;
    await order.save();

    await Notification.create({
      userId: order.userId,
      title: "Order Delivered",
      message: `Order #${orderCode(order._id)} has been delivered.`,
      type: "success",
    });

    const deliveryBoy = await User.findById(req.user.id).select("name email phone");
    await createAdminNotification({
      title: "Order Delivered",
      message: `${deliveryBoy?.name || "Delivery boy"} delivered order #${orderCode(order._id)} | ${formatPaymentMethod(order.paymentMethod)} | Total ₹${Number(order.total || 0)}`,
      type: "success",
      actionPath: "/admin/orders",
      data: {
        event: "order_delivered",
        orderId: String(order._id),
        deliveryBoyId: String(req.user.id),
        paymentMethod: formatPaymentMethod(order.paymentMethod),
        total: order.total,
      },
    });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getDeliveryEarnings = async (req, res) => {
  try {
    const deliveryUser = await requireDeliveryProfile(req, res);
    if (!deliveryUser) return;
    const [orders, user] = await Promise.all([
      Order.find({ assignedDeliveryBoy: req.user.id, paymentMethod: { $regex: /^cod$/i } }).sort({ createdAt: -1 }).lean(),
      User.findById(req.user.id).select("deliveryCredit").lean(),
    ]);
    const deliveredCodOrders = orders.filter((order) => order.status === "Delivered");
    const totalCodAmount = deliveredCodOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    res.json({
      totalCodOrders: orders.length,
      totalCodAmount,
      deliveredCodOrders: deliveredCodOrders.length,
      currentCredit: user?.deliveryCredit || 0,
      rows: orders.map((order) => ({
        date: order.deliveredAt || order.createdAt,
        orderId: order._id,
        customer: order.phone || "Customer",
        amount: order.total || 0,
        status: order.status,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
