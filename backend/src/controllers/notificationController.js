import Notification from "../models/Notification.js";

/* ================= CREATE NOTIFICATION ================= */
export const createNotification = async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;
    
    const notification = await Notification.create({
      userId,
      title,
      message,
      type
    });

    res.json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET ALL NOTIFICATIONS (ADMIN) ================= */
export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET MY NOTIFICATIONS (USER) ================= */
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      $or: [ { userId: req.user.id }, { userId: { $exists: false } }, { userId: null }, { userId: "" } ] 
    }).sort({ createdAt: -1 });
    
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= MARK AS READ ================= */
export const markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    await Notification.findByIdAndUpdate(notificationId, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
