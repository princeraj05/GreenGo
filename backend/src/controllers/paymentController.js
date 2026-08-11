import Razorpay from "razorpay";
import crypto from "crypto";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Food from "../models/Food.js";
import Coupon from "../models/Coupon.js";
import SecurityLog from "../models/SecurityLog.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Settings from "../models/Settings.js";
import { calculateOrderAmount } from "../utils/paymentCalculator.js";
import { sendPushToUser, sendPushToAdmins } from "../utils/pushNotification.js";
import { createAdminNotification, orderCode, formatPaymentMethod } from "../services/adminNotificationService.js";

/**
 * createRazorpayOrder: Recalculates final payable amount securely on the server
 * and registers a "Pending" order in MongoDB before initiating Razorpay checkout.
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    const { items, address, latitude, longitude, couponCode, customMessage, phone } = req.body;

    // Securely calculate pricing entirely server-side
    const calculated = await calculateOrderAmount({
      userId: req.user.id,
      items,
      address,
      latitude,
      longitude,
      paymentMethod: "Online",
      couponCode
    });

    const settings = await Settings.findOne();
    if (settings && settings.minOrderAmount && calculated.subtotal < settings.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum ₹${settings.minOrderAmount} ka order karein tabhi order accept kiya jayega.`
      });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: calculated.total * 100, // paise
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Create order as "Pending" in the database to record user checkout details securely
    const order = await Order.create({
      userId: req.user.id,
      items: calculated.items,
      address,
      phone: phone || req.user.phone,
      paymentMethod: "Online",
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
      razorpayOrderId: razorpayOrder.id,
      paymentStatus: "Pending",
      status: "PaymentPending",
      couponCode: calculated.couponCode,
      discountAmount: calculated.couponDiscount
    });

    res.json({
      success: true,
      order: razorpayOrder,
      calculatedAmount: calculated.total,
      localOrderId: order._id
    });
  } catch (err) {
    console.error("Razorpay Create Order Error:", err);
    res.status(500).json({ success: false, message: err.message || "Could not create Razorpay order" });
  }
};

/**
 * Shared atomic database update logic for both verify and webhook routes.
 * Run stock validation, stock decrement, and coupon deactivation inside a session transaction.
 */
const processSuccessfulPayment = async (razorpayOrderId, razorpayPaymentId, expectedAmount, reqInfo) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await Order.findOne({ razorpayOrderId }).session(session);
    if (!order) {
      throw new Error(`Order not found for Razorpay Order ID: ${razorpayOrderId}`);
    }

    // Idempotency: if already paid, return order directly
    if (order.paymentStatus === "Paid") {
      await session.commitTransaction();
      session.endSession();
      return { order, alreadyProcessed: true };
    }

    // Validate quantities, availability, and decrement stock levels atomically
    for (const item of order.items) {
      const food = await Food.findById(item.foodId).session(session);
      if (!food) {
        throw new Error(`Product not found: ${item.name}`);
      }
      if (!food.isAvailable || food.availableQty <= 0 || food.isDeleted) {
        throw new Error(`Product ${food.name} is currently unavailable.`);
      }
      if (food.availableQty < item.qty) {
        throw new Error(`Insufficient stock for ${food.name}.`);
      }

      food.availableQty = Math.max(0, food.availableQty - item.qty);
      if (food.availableQty === 0) {
        food.isAvailable = false;
      }
      await food.save({ session });
    }

    // If using user-bound coupon, deactivate it
    if (order.couponCode) {
      const couponDoc = await Coupon.findOne({ code: order.couponCode }).session(session);
      if (couponDoc && couponDoc.userId) {
        couponDoc.active = false;
        await couponDoc.save({ session });
      }
    }

    // Update order payment status to Paid
    order.paymentStatus = "Paid";
    order.transactionId = razorpayPaymentId;
    order.razorpayPaymentId = razorpayPaymentId;
    order.status = "Pending";
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return { order, alreadyProcessed: false };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

/**
 * runPostPaymentActions: Handles non-critical post-payment events outside the main transaction.
 * Sends push notifications, admin alerts, emails, and updates referral metrics.
 */
const runPostPaymentActions = async (order, userId, ipAddress, userAgent, razorpayOrderId, razorpayPaymentId) => {
  try {
    // 1. Audit Logging
    await SecurityLog.create({
      userId,
      action: "payment_verification_success",
      details: `Successful payment verification for Order #${orderCode(order._id)}. Amount: ₹${order.total}. Razorpay Order: ${razorpayOrderId}, Payment: ${razorpayPaymentId}`,
      ipAddress,
      userAgent
    });

    // 2. Notification / Referral logic
    if (order.discountAmount > 0 && order.couponCode) {
      const cleanCode = String(order.couponCode).trim().toUpperCase();
      if (cleanCode === "NEW50") {
        await Notification.create({
          userId,
          title: "Coupon Applied!",
          message: "new users coupon use successfully",
          type: "success"
        });
        try {
          await sendPushToUser(userId, "Coupon Applied!", "new users coupon use successfully");
        } catch (e) {
          console.error("Push notification failed:", e);
        }
      }

      // Referrer reward code execution
      const couponDoc = await Coupon.findOne({ code: cleanCode });
      if (couponDoc && couponDoc.referrerId) {
        const previousOrders = await Order.countDocuments({
          userId,
          _id: { $ne: order._id },
          paymentStatus: "Paid"
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
          } catch (e) {
            console.error("Referral reward push failed:", e);
          }
        }
      }
    }

    // 3. User notifications
    await Notification.create({
      userId,
      title: "Order placed",
      message: `Your order #${orderCode(order._id)} has been placed successfully.`,
      type: "success",
    });

    sendPushToUser(userId, "Order placed", `Your order #${orderCode(order._id)} has been placed successfully.`, { orderId: String(order._id) });
    sendPushToAdmins(
      "New Order Placed",
      `Order #${orderCode(order._id)} | Total: ₹${order.total} | Payment: Online`,
      { orderId: String(order._id) }
    );

    const customer = await User.findById(userId).select("name email phone");
    await createAdminNotification({
      title: "New Order Placed",
      message: `Order #${orderCode(order._id)} | Online | Total ₹${Number(order.total || 0)} | ${customer?.name || "Customer"} | ${customer?.email || "N/A"} | ${order.phone || customer?.phone || "N/A"}`,
      type: "success",
      actionPath: "/admin/orders",
      data: {
        event: "new_order",
        orderId: String(order._id),
        userId: String(userId),
        paymentMethod: "Online",
        total: order.total,
      },
    });

  } catch (err) {
    console.error("Background post-payment tasks failed:", err);
  }
};

/**
 * verifyRazorpayPayment: Handles frontend callback payment verification.
 * Confirms cryptographic signature, queries Razorpay API to confirm payment capture status,
 * validates amounts, and executes order updates atomically.
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.warn(`[METRIC] failed_verification_missing_fields`);
      return res.status(400).json({ success: false, message: "Missing required signature fields." });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;
    if (!isAuthentic) {
      console.warn(`[METRIC] signature_verification_failed | orderId: ${razorpay_order_id} | paymentId: ${razorpay_payment_id}`);
      await SecurityLog.create({
        userId: req.user.id,
        action: "payment_signature_verification_failed",
        details: `Invalid payment signature submitted. Razorpay Order: ${razorpay_order_id}, Payment: ${razorpay_payment_id}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    console.log(`[METRIC] signature_verification_success | orderId: ${razorpay_order_id} | paymentId: ${razorpay_payment_id}`);

    // Query Razorpay API directly for authoritative state check
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
    if (!paymentDetails || paymentDetails.status !== "captured" || paymentDetails.order_id !== razorpay_order_id) {
      console.warn(`[METRIC] payment_not_captured | orderId: ${razorpay_order_id} | paymentId: ${razorpay_payment_id} | status: ${paymentDetails?.status}`);
      return res.status(400).json({ success: false, message: "Payment was not captured or belongs to a different order." });
    }

    const orderDetails = await razorpay.orders.fetch(razorpay_order_id);
    if (!orderDetails) {
      console.warn(`[METRIC] order_details_fetch_failed | orderId: ${razorpay_order_id}`);
      return res.status(400).json({ success: false, message: "Razorpay order details not found." });
    }

    const orderDoc = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!orderDoc) {
      console.warn(`[METRIC] local_order_not_found | orderId: ${razorpay_order_id}`);
      return res.status(404).json({ success: false, message: "Local order record not found." });
    }

    // Triple Amount Validation
    const expectedAmountPaise = orderDoc.total * 100;
    if (paymentDetails.amount !== expectedAmountPaise || orderDetails.amount !== expectedAmountPaise) {
      console.warn(`[METRIC] amount_mismatch | orderId: ${razorpay_order_id} | expected: ${expectedAmountPaise} | orderDetails: ${orderDetails.amount} | paymentDetails: ${paymentDetails.amount}`);
      await SecurityLog.create({
        userId: req.user.id,
        action: "payment_amount_mismatch",
        details: `Payment amount mismatch. Expected: ${expectedAmountPaise} paise, Razorpay Order: ${orderDetails.amount} paise, Payment: ${paymentDetails.amount} paise`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
      return res.status(400).json({ success: false, message: "Payment amount mismatch." });
    }

    // Process payment atomically and idempotently
    const { order, alreadyProcessed } = await processSuccessfulPayment(
      razorpay_order_id,
      razorpay_payment_id,
      orderDoc.total,
      { ipAddress: req.ip, userAgent: req.headers["user-agent"] }
    );

    if (alreadyProcessed) {
      console.log(`[METRIC] duplicate_verification_attempt | orderId: ${razorpay_order_id} | paymentId: ${razorpay_payment_id}`);
    } else {
      console.log(`[METRIC] payment_success | orderId: ${razorpay_order_id} | paymentId: ${razorpay_payment_id}`);
      runPostPaymentActions(
        order,
        req.user.id,
        req.ip,
        req.headers["user-agent"],
        razorpay_order_id,
        razorpay_payment_id
      );
    }

    res.json({ success: true, message: "Payment verified successfully" });
  } catch (err) {
    console.error(`[METRIC] verification_error | error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message || "Payment verification failed" });
  }
};

/**
 * handleRazorpayWebhook: Authoritative backend sync point for payment status changes.
 * Acts as an idempotent counterpart to verifyRazorpayPayment in case of client disconnects.
 */
export const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSignature || !webhookSecret) {
      return res.status(400).json({ success: false, message: "Missing webhook signature or config." });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (expectedSignature !== webhookSignature) {
      console.warn(`[METRIC] webhook_signature_failed`);
      await SecurityLog.create({
        action: "webhook_signature_failed",
        details: `Invalid webhook signature header: ${webhookSignature}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const { event, payload } = req.body;
    if (event === "payment.captured") {
      const payment = payload.payment.entity;
      const razorpay_order_id = payment.order_id;
      const razorpay_payment_id = payment.id;

      const orderDoc = await Order.findOne({ razorpayOrderId: razorpay_order_id });
      if (!orderDoc) {
        console.warn(`[METRIC] webhook_local_order_not_found | orderId: ${razorpay_order_id}`);
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      // Triple verification in Webhook
      const expectedAmountPaise = orderDoc.total * 100;
      if (payment.amount !== expectedAmountPaise) {
        console.warn(`[METRIC] webhook_amount_mismatch | orderId: ${razorpay_order_id} | expected: ${expectedAmountPaise} | captured: ${payment.amount}`);
        await SecurityLog.create({
          userId: String(orderDoc.userId),
          action: "webhook_amount_mismatch",
          details: `Webhook payment amount mismatch. Expected: ${expectedAmountPaise} paise, Webhook captured: ${payment.amount} paise`,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"]
        });
        return res.status(400).json({ success: false, message: "Amount mismatch" });
      }

      const { order, alreadyProcessed } = await processSuccessfulPayment(
        razorpay_order_id,
        razorpay_payment_id,
        orderDoc.total,
        { ipAddress: req.ip, userAgent: req.headers["user-agent"] }
      );

      if (alreadyProcessed) {
        console.log(`[METRIC] webhook_duplicate_attempt | orderId: ${razorpay_order_id}`);
      } else {
        console.log(`[METRIC] webhook_payment_success | orderId: ${razorpay_order_id} | paymentId: ${razorpay_payment_id}`);
        runPostPaymentActions(
          order,
          String(orderDoc.userId),
          req.ip,
          req.headers["user-agent"],
          razorpay_order_id,
          razorpay_payment_id
        );
      }
    }

    res.json({ success: true, message: "Webhook processed" });
  } catch (err) {
    console.error(`[METRIC] webhook_processing_failure | error: ${err.message}`);
    res.status(500).json({ success: false, message: "Webhook failed" });
  }
};

/**
 * createRazorpayOrderDirect: Creates a Razorpay order from direct request parameters.
 * Validates amount >= 100 paise.
 */
export const createRazorpayOrderDirect = async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;

    if (!amount || Number(amount) < 100) {
      return res.status(400).json({ success: false, message: "Amount must be at least 100 paise" });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Number(amount),
      currency: currency || "INR",
      receipt: receipt || `receipt_order_${Date.now()}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.json({
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency
    });
  } catch (err) {
    console.error("Razorpay Create Order Direct Error:", err);
    res.status(500).json({ success: false, message: err.message || "Could not create Razorpay order" });
  }
};

/**
 * verifyRazorpayPaymentDirect: Verifies signature for a Razorpay payment directly.
 */
export const verifyRazorpayPaymentDirect = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing required signature fields." });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;
    if (!isAuthentic) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    res.json({ success: true, message: "Payment verified successfully" });
  } catch (err) {
    console.error("Razorpay Verify Signature Direct Error:", err);
    res.status(500).json({ success: false, message: err.message || "Payment verification failed" });
  }
};
