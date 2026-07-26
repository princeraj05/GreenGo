import Order from "../models/Order.js";
import Settings from "../models/Settings.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Food from "../models/Food.js";
import Coupon from "../models/Coupon.js";
import SecurityLog from "../models/SecurityLog.js";
import { sendPushToUser, sendPushToAdmins } from "../utils/pushNotification.js";
import Razorpay from "razorpay";
import { createAdminNotification, formatPaymentMethod, orderCode } from "../services/adminNotificationService.js";
import mongoose from "mongoose";
import { calculateOrderAmount } from "../utils/paymentCalculator.js";

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

const getSlabAmount = (slabs = [], distance = null, fallback = 0, isCod = false) => {
  const km = Number(distance || 0);
  const sortedSlabs = Array.isArray(slabs)
    ? slabs
        .map((slab) => ({
          upToKm: Number(slab?.upToKm || 0),
          amount: Number(slab?.amount || 0),
          cod: slab?.cod !== undefined ? Boolean(slab.cod) : true,
          online: slab?.online !== undefined ? Boolean(slab.online) : true,
        }))
        .filter((slab) => {
          if (slab.upToKm <= 0) return false;
          return isCod ? slab.cod : slab.online;
        })
        .sort((a, b) => a.upToKm - b.upToKm)
    : [];
  if (!sortedSlabs.length || !Number.isFinite(km) || km <= 0) return Number(fallback || 0);
  const matchedSlab = sortedSlabs.find((slab) => km <= slab.upToKm) || sortedSlabs[sortedSlabs.length - 1];
  return Number(matchedSlab?.amount || 0);
};

const creditDeliveryBoyAmount = async (order) => {
  if (!order.assignedDeliveryBoy) return;
  await User.findByIdAndUpdate(order.assignedDeliveryBoy, {
    $inc: { deliveryCredit: Number(order.deliveryBoyAmount || 0) }
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
      latitude,
      longitude,
      customMessage,
      transactionId,
      couponCode
    } = req.body;

    const isCod = String(paymentMethod).toUpperCase() === "COD";

    // 1. If online order, check if verify/webhook already created the order (Idempotency)
    if (!isCod && transactionId) {
      const existingOrder = await Order.findOne({ transactionId });
      if (existingOrder) {
        return res.json({
          success: true,
          order: existingOrder
        });
      }
      return res.status(400).json({
        message: "Order payment not verified yet or payment failed."
      });
    }

    // 2. Perform backend pricing, coupon, stock and distance calculation
    const calculated = await calculateOrderAmount({
      userId: req.user.id,
      items,
      address,
      latitude,
      longitude,
      paymentMethod,
      couponCode
    });

    // 3. Start MongoDB session/transaction to perform atomic stock update & order creation
    const session = await mongoose.startSession();
    session.startTransaction();

    let order;
    try {
      // Stock check and decrement
      for (const item of calculated.items) {
        const food = await Food.findById(item.foodId).session(session);
        if (!food || !food.isAvailable || food.availableQty < item.qty || food.isDeleted) {
          throw new Error(`Insufficient stock or product unavailable: ${item.name}`);
        }
        food.availableQty = Math.max(0, food.availableQty - item.qty);
        if (food.availableQty === 0) {
          food.isAvailable = false;
        }
        await food.save({ session });
      }

      // Coupon deactivation
      if (calculated.couponCode) {
        const couponDoc = await Coupon.findOne({ code: calculated.couponCode }).session(session);
        if (couponDoc && couponDoc.userId) {
          couponDoc.active = false;
          await couponDoc.save({ session });
        }
      }

      // Create Order in DB
      const orderArray = await Order.create([{
        userId: req.user.id,
        items: calculated.items,
        address,
        phone: phone || req.user.phone,
        paymentMethod: "COD",
        subtotal: calculated.subtotal,
        deliveryCharge: calculated.deliveryCharge,
        deliveryBoyAmount: calculated.deliveryBoyAmount,
        rainCharge: calculated.rainCharge,
        festivalCharge: calculated.festivalCharge,
        platformCharge: calculated.platformCharge,
        surcharges: calculated.surcharges,
        surchargesAmount: calculated.surchargesAmount,
        total: calculated.total,
        distance: calculated.distance,
        latitude,
        longitude,
        customMessage: customMessage || "",
        transactionId: "",
        paymentStatus: "Pending",
        status: "Pending",
        couponCode: calculated.couponCode,
        discountAmount: calculated.couponDiscount
      }], { session });

      order = orderArray[0];

      await session.commitTransaction();
      session.endSession();
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: err.message || "Order creation failed" });
    }

    // 4. Run post-payment actions asynchronously outside transaction
    const runCodPostActions = async () => {
      try {
        await SecurityLog.create({
          userId: req.user.id,
          action: "cod_order_created",
          details: `COD Order #${orderCode(order._id)} created. Total: ₹${order.total}`,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"]
        });

        if (order.discountAmount > 0 && order.couponCode) {
          const cleanCode = String(order.couponCode).trim().toUpperCase();
          if (cleanCode === "NEW50") {
            await Notification.create({
              userId: req.user.id,
              title: "Coupon Applied!",
              message: "new users coupon use successfully",
              type: "success"
            });
            try {
              await sendPushToUser(req.user.id, "Coupon Applied!", "new users coupon use successfully");
            } catch (pushErr) {
              console.error("Failed to send NEW50 push:", pushErr);
            }
          }

          const couponDoc = await Coupon.findOne({ code: cleanCode });
          if (couponDoc && couponDoc.referrerId) {
            const previousOrders = await Order.countDocuments({
              userId: req.user.id,
              _id: { $ne: order._id },
              paymentStatus: { $in: ["Paid", "Pending"] }
            });
            if (previousOrders === 0) {
              const settings = await Settings.findOne();
              const rewardReferrer = settings?.referralRewardReferrer || 20;

              const referrer = await User.findById(couponDoc.referrerId);
              const referrerName = referrer ? (referrer.name || "USER").split(" ")[0].replace(/[^a-z0-9]/gi, "").toUpperCase() : "USER";
              const uniqueSuffix = String(order._id).slice(-4).toUpperCase();
              const rewardCode = `REFER${rewardReferrer}-${referrerName}-${uniqueSuffix}`;

              const expiry = new Date();
              expiry.setFullYear(expiry.getFullYear() + 1);

              await Coupon.create({
                code: rewardCode,
                title: `Referral Reward for ${referrer?.name || "User"}`,
                discountType: "flat",
                discountValue: rewardReferrer,
                minimumOrder: 0,
                expiryDate: expiry,
                active: true,
                userId: String(couponDoc.referrerId)
              });

              await Notification.create({
                userId: String(couponDoc.referrerId),
                title: "Referral Reward Earned!",
                message: `Congratulations! Your friend used your referral code. You earned a ₹${rewardReferrer} discount coupon: ${rewardCode}`,
                type: "success",
                data: { couponCode: rewardCode }
              });

              try {
                await sendPushToUser(
                  String(couponDoc.referrerId),
                  "Referral Reward Earned!",
                  `Congratulations! Your friend used your referral code. You earned a ₹${rewardReferrer} discount coupon: ${rewardCode}`,
                  { couponCode: rewardCode }
                );
              } catch (pushErr) {
                console.error("Failed to send referral reward push:", pushErr);
              }
            }
          }
        }

        await Notification.create({
          userId: req.user.id,
          title: "Order placed",
          message: `Your order #${orderCode(order._id)} has been placed successfully.`,
          type: "success",
        });
        sendPushToUser(req.user.id, "Order placed", `Your order #${orderCode(order._id)} has been placed successfully.`, { orderId: String(order._id) });
        sendPushToAdmins(
          "New Order Placed",
          `Order #${orderCode(order._id)} | Total: ₹${order.total} | Payment: COD`,
          { orderId: String(order._id) }
        );

        const customer = await User.findById(req.user.id).select("name email phone");
        await createAdminNotification({
          title: "New Order Placed",
          message: `Order #${orderCode(order._id)} | COD | Total ₹${Number(order.total || 0)} | ${customer?.name || "Customer"} | ${customer?.email || "N/A"} | ${phone || customer?.phone || "N/A"}`,
          type: "warning",
          actionPath: "/admin/orders",
          data: {
            event: "new_order",
            orderId: String(order._id),
            userId: String(req.user.id),
            paymentMethod: "COD",
            total: order.total,
          },
        });
      } catch (err) {
        console.error("COD post actions failed:", err);
      }
    };

    // Run asynchronously
    runCodPostActions();

    res.json({
      success: true,
      order
    });

  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({
      message: "Order failed"
    });
  }
};


/* ================= ADMIN – ALL ORDERS ================= */

export const getAllOrders = async (req,res)=>{
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Not admin" });
    const orders = await Order
    .find({ status: { $ne: "PaymentPending" } })
    .populate("assignedDeliveryBoy", "name phone email role deliveryCredit")
    .populate("userId", "name phone email birthDate")
    .sort({createdAt:-1})
    .lean();

    res.json(orders);
  } catch (err) {
    console.error("getAllOrders error:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};


/* ================= USER – MY ORDERS ================= */

export const getMyOrders = async (req,res)=>{

  const orders = await Order
  .find({userId:req.user.id, status: { $ne: "PaymentPending" }})  // ✅ FIX
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

export const updateOrderStatus = async (req, res) => {
  const { status, cancellationReason, cancellationCustomMessage } = req.body;
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
      await creditDeliveryBoyAmount(order);
    }

    const update = { status };
    if (status === "Delivered") {
      update.deliveredAt = new Date();
      update.assignmentStatus = order.assignedDeliveryBoy ? "Delivered" : order.assignmentStatus;
    }
    if (status === "Cancelled") {
      update.cancelledAt = new Date();
      update.cancellationReason = cancellationReason || "Cancelled by Admin";
      update.cancellationCustomMessage = cancellationCustomMessage || "";
      update.cancellationStatus = "Approved";
    }

    if (req.body.etaMinutes !== undefined) {
      update.etaMinutes = Number(req.body.etaMinutes);
      update.etaSetAt = new Date();
    }

    await Order.findByIdAndUpdate(orderId, update);

    if (status && status !== previousStatus) {
      const statusMessages = {
        Pending: "Your order is pending confirmation.",
        Preparing: "Your order is now being prepared.",
        "Out for Delivery": "Your order is out for delivery.",
        Delivered: "Your order has been delivered. Enjoy your meal!",
        Cancelled: `Your order has been cancelled: ${cancellationReason || "Cancelled by Admin"}`,
      };

      await Notification.create({
        userId: order.userId,
        title: `Order ${status}`,
        message: `Order #${orderCode(order._id)}: ${statusMessages[status] || `Status changed to ${status}.`}`,
        type: status === "Cancelled" ? "danger" : status === "Delivered" ? "success" : "info",
      });
      sendPushToUser(
        order.userId,
        `Order ${status}`,
        `Order #${orderCode(order._id)}: ${statusMessages[status] || `Status changed to ${status}.`}`,
        { orderId: String(order._id), status: status }
      );

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
    sendPushToUser(
      String(deliveryBoyId),
      wasReassigned ? "Order Reassigned" : "New Order Assigned",
      `Order #${orderCode(order._id)} has been assigned to you.`,
      { orderId: String(order._id) }
    );

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
    const orders = await Order.find({ assignedDeliveryBoy: req.user.id })
      .populate("userId", "name phone email birthDate")
      .sort({ createdAt: -1 })
      .lean();
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
    sendPushToUser(
      order.userId,
      "Delivery partner accepted",
      `Order #${orderCode(order._id)} has been accepted by your delivery partner.`,
      { orderId: String(order._id) }
    );

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
    sendPushToAdmins(
      "Delivery Boy Accepted Order",
      `${deliveryBoy?.name || "Delivery boy"} accepted order #${orderCode(order._id)}.`,
      { orderId: String(order._id) }
    );

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
    sendPushToAdmins(
      "Order rejected by delivery boy",
      `Order #${orderCode(order._id)} was rejected${reason ? `: ${reason}` : "."}`,
      { orderId: String(order._id) }
    );

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
    await creditDeliveryBoyAmount(order);

    order.status = "Delivered";
    order.assignmentStatus = "Delivered";
    order.deliveredAt = new Date();
    await order.save();

    await Notification.create({
      userId: order.userId,
      title: "Order Delivered",
      message: `Order #${orderCode(order._id)} has been delivered.`,
      type: "success",
    });
    sendPushToUser(
      order.userId,
      "Order Delivered",
      `Order #${orderCode(order._id)} has been delivered.`,
      { orderId: String(order._id) }
    );

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
    sendPushToAdmins(
      "Order Delivered",
      `${deliveryBoy?.name || "Delivery boy"} delivered order #${orderCode(order._id)}.`,
      { orderId: String(order._id) }
    );

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
      Order.find({ assignedDeliveryBoy: req.user.id }).sort({ createdAt: -1 }).lean(),
      User.findById(req.user.id).select("deliveryCredit").lean(),
    ]);
    const deliveredCodOrders = orders.filter((order) => order.status === "Delivered" && isCodPayment(order.paymentMethod));
    const totalCodAmount = deliveredCodOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const totalDeliveryBoyAmount = orders
      .filter((order) => order.status === "Delivered")
      .reduce((sum, order) => sum + Number(order.deliveryBoyAmount || 0), 0);
    res.json({
      totalCodOrders: orders.filter((order) => isCodPayment(order.paymentMethod)).length,
      totalCodAmount,
      totalDeliveryBoyAmount,
      deliveredCodOrders: deliveredCodOrders.length,
      currentCredit: user?.deliveryCredit || 0,
      rows: orders.map((order) => ({
        date: order.deliveredAt || order.createdAt,
        orderId: order._id,
        customer: order.phone || "Customer",
        amount: order.total || 0,
        deliveryBoyAmount: order.deliveryBoyAmount || 0,
        distance: order.distance || 0,
        status: order.status,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Check if the order belongs to the user
    if (String(order.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not authorized to cancel this order" });
    }
    
    // Check if 5 minutes have passed
    const timeDiff = Date.now() - new Date(order.createdAt).getTime();
    if (timeDiff > 5 * 60 * 1000) {
      // Log cancellation attempt
      await SecurityLog.create({
        userId: req.user.id,
        action: "order_cancellation_failed",
        details: `Failed attempt to cancel Order ID: ${order._id}. Reason: Timeout (time elapsed: ${(timeDiff/1000).toFixed(0)}s).`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'] || ""
      });
      return res.status(400).json({ message: "Cannot cancel order. 5 minutes have already passed." });
    }
    
    // ENFORCE ORDER STATUS = PENDING ONLY
    if (order.status !== "Pending") {
      await SecurityLog.create({
        userId: req.user.id,
        action: "order_cancellation_failed",
        details: `Failed attempt to cancel Order ID: ${order._id}. Reason: Order status is '${order.status}' (only 'Pending' allowed).`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'] || ""
      });
      return res.status(400).json({ message: `Cancellation blocked: Order status is '${order.status}' and is already being processed.` });
    }

    const reason = req.body.reason || "No reason specified";
    const customMessage = req.body.customMessage || "";
    
    order.status = "CancellationRequested";
    order.cancellationReason = reason;
    order.cancellationCustomMessage = customMessage;
    order.cancellationStatus = "Pending";
    await order.save();

    // Log cancellation request
    await SecurityLog.create({
      userId: req.user.id,
      action: "order_cancellation_requested",
      details: `Cancellation requested for Order ID: ${order._id}. Reason: ${reason}. Custom Message: ${customMessage}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] || ""
    });
    
    // Create notification for user
    await Notification.create({
      userId: req.user.id,
      title: "Cancellation Requested",
      message: `Your cancellation request for order #${orderCode(order._id)} has been sent to the admin.`,
      type: "info",
    });
    sendPushToAdmins(
      "Cancellation Request",
      `Cancellation requested for Order #${orderCode(order._id)}. Reason: ${reason}`,
      { orderId: String(order._id) }
    );
    
    // Create admin notification
    const customer = await User.findById(req.user.id).select("name email phone");
    await createAdminNotification({
      title: "Cancellation Request Received",
      message: `Cancellation requested for Order #${orderCode(order._id)} | Paid via: ${formatPaymentMethod(order.paymentMethod)} | Total: ₹${order.total} | User: ${customer?.name || "N/A"} | Email: ${customer?.email || "N/A"} | Phone: ${order.phone || customer?.phone || "N/A"} | Reasons: ${reason} | Message: ${customMessage}`,
      type: "warning",
      actionPath: "/admin/cancelled-orders",
      data: {
        event: "order_cancellation_requested",
        orderId: String(order._id),
        userId: String(req.user.id),
        userName: customer?.name || "N/A",
        userEmail: customer?.email || "N/A",
        userPhone: order.phone || customer?.phone || "N/A",
        total: order.total,
        paymentMethod: order.paymentMethod,
        cancellationReason: reason,
        cancellationCustomMessage: customMessage,
        requestedAt: new Date()
      },
    });
    
    res.json({ success: true, message: "Cancellation request sent successfully", order });
  } catch (err) {
    console.error("Cancel order error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const approveCancelOrder = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Not admin" });
    
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status !== "CancellationRequested") {
      return res.status(400).json({ message: "No active cancellation request for this order" });
    }

    order.status = "Cancelled";
    order.cancellationStatus = "Approved";
    order.cancelledAt = new Date();

    let isRefunded = false;
    let refundErrorMsg = "";

    // For online payments, perform refund
    if (order.paymentMethod !== "COD" && order.transactionId) {
      try {
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        
        await razorpay.payments.refund(order.transactionId, {
          amount: Math.round(order.total * 100) // in paise
        });
        isRefunded = true;
      } catch (refundErr) {
        console.error("Razorpay refund failed during approval:", refundErr);
        refundErrorMsg = refundErr.message || "Refund API call failed";
      }
    }

    await order.save();

    // Log approval
    await SecurityLog.create({
      userId: req.user.id,
      action: "order_cancellation_approved",
      details: `Admin approved cancellation for Order ID: ${order._id}. Refund processed: ${isRefunded}.`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] || ""
    });

    // Notify user
    const refundMessageText = order.paymentMethod !== "COD"
      ? `Your refund of ₹${order.total} has been initiated and will be credited to your bank account within 5-7 business days.`
      : "Your order has been cancelled successfully.";

    await Notification.create({
      userId: order.userId,
      title: "Order Cancelled",
      message: `Your order #${orderCode(order._id)} has been cancelled by admin. ${refundMessageText}`,
      type: "success",
    });
    sendPushToUser(
      order.userId,
      "Order Cancelled",
      `Your order #${orderCode(order._id)} has been cancelled by admin.`,
      { orderId: String(order._id) }
    );

    res.json({ success: true, message: "Order cancellation approved successfully", order, refundMessage: refundMessageText });
  } catch (err) {
    console.error("Approve cancel error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const rejectCancelOrder = async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ message: "Not admin" });
    
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status !== "CancellationRequested") {
      return res.status(400).json({ message: "No active cancellation request for this order" });
    }

    const adminMessage = req.body.message || "Order cancel nahi kr skte h food prepsered ho gya";

    order.status = "Pending"; // Restore to original active status
    order.cancellationStatus = "Rejected";
    await order.save();

    // Log rejection
    await SecurityLog.create({
      userId: req.user.id,
      action: "order_cancellation_rejected",
      details: `Admin rejected cancellation for Order ID: ${order._id}. Message: ${adminMessage}`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] || ""
    });

    // Notify user
    await Notification.create({
      userId: order.userId,
      title: "Cancellation Request Rejected",
      message: `Order #${orderCode(order._id)}: ${adminMessage}`,
      type: "danger",
    });
    sendPushToUser(
      order.userId,
      "Cancellation Request Rejected",
      `Order #${orderCode(order._id)}: ${adminMessage}`,
      { orderId: String(order._id) }
    );

    res.json({ success: true, message: "Order cancellation request rejected successfully", order });
  } catch (err) {
    console.error("Reject cancel error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
