import Notification from "../models/Notification.js";

export const orderCode = (orderId) => String(orderId || "").slice(-6).toUpperCase();

export const formatPaymentMethod = (method = "") => {
  const value = String(method || "").trim();
  if (!value) return "Payment not selected";
  if (/cod/i.test(value)) return "COD";
  if (/upi/i.test(value)) return "UPI";
  if (/bank|card|netbanking|online/i.test(value)) return "Banking/Online";
  return value;
};

export const createAdminNotification = async ({
  title,
  message,
  type = "info",
  actionPath = "",
  data = {},
}) => {
  try {
    return await Notification.create({
      title,
      message,
      type,
      audience: "admin",
      actionPath,
      data,
    });
  } catch (err) {
    console.error("Admin notification failed:", err);
    return null;
  }
};
