import Notification from "../models/Notification.js";

/* ================= CREATE NOTIFICATION ================= */
export const createNotification = async (req, res) => {
  try {
    const { userId, title, message, type, expiresAt } = req.body;
    
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    res.json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET ALL NOTIFICATIONS (ADMIN) ================= */
export const getAllNotifications = async (req, res) => {
  try {
    // Exclude expired notifications
    const notifications = await Notification.find({
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET MY NOTIFICATIONS (USER) ================= */
export const getMyNotifications = async (req, res) => {
  try {
    // Fetch notifications that belong to user or are global broadcasts, and are not expired
    const notifications = await Notification.find({
      $and: [
        {
          $or: [
            { userId: req.user.id },
            { userId: { $exists: false } },
            { userId: null },
            { userId: "" }
          ]
        },
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } }
          ]
        }
      ]
    }).sort({ createdAt: -1 });
    
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE NOTIFICATION (ADMIN) ================= */
export const updateNotification = async (req, res) => {
  try {
    const { title, message, type, expiresAt } = req.body;
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      {
        title,
        message,
        type,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= DELETE NOTIFICATION (ADMIN) ================= */
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({ success: true });
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
