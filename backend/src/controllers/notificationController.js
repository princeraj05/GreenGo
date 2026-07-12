import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendPushToUser, sendPushToAllUsers, sendPushToAdmins } from "../utils/pushNotification.js";

const activeNotificationFilter = () => ({
  $or: [
    { expiresAt: { $exists: false } },
    { expiresAt: null },
    { expiresAt: { $gt: new Date() } }
  ]
});

const isAdmin = (user) => user?.role === "admin";

const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const ensureTodayBirthdayNotifications = async () => {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();
  const key = todayKey();
  const users = await User.find({
    birthDate: { $exists: true, $ne: null },
    role: { $nin: ["admin", "deliveryBoy"] }
  }).select("name email phone birthDate");

  for (const user of users) {
    const date = new Date(user.birthDate);
    if (date.getMonth() !== month || date.getDate() !== day) continue;

    const exists = await Notification.exists({
      audience: "admin",
      "data.event": "birthday_today",
      "data.userId": String(user._id),
      "data.date": key,
    });
    if (exists) continue;

    await Notification.create({
      audience: "admin",
      title: "User Birthday Today",
      message: `${user.name || "Customer"} has a birthday today. Email: ${user.email || "N/A"} | Phone: ${user.phone || "N/A"}`,
      type: "success",
      actionPath: "/admin/users",
      data: {
        event: "birthday_today",
        userId: String(user._id),
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        date: key,
      },
    });

    await sendPushToAdmins(
      "User Birthday Today",
      `${user.name || "Customer"} has a birthday today. Email: ${user.email || "N/A"} | Phone: ${user.phone || "N/A"}`,
      {
        event: "birthday_today",
        userId: String(user._id),
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        date: key,
      }
    );
  }
};

/* ================= CREATE NOTIFICATION ================= */
export const createNotification = async (req, res) => {
  try {
    const { userId, title, message, type, expiresAt, audience, actionPath, data } = req.body;
    
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      audience: audience === "admin" ? "admin" : "user",
      actionPath: actionPath || "",
      data: data || {},
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    if (userId && audience !== "admin") {
      sendPushToUser(userId, title, message, data || {});
    } else if (!userId && audience === "user") {
      sendPushToAllUsers(title, message, data || {});
    }

    res.json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET ALL NOTIFICATIONS (ADMIN) ================= */
export const getAllNotifications = async (req, res) => {
  try {
    await ensureTodayBirthdayNotifications();
    const notifications = await Notification.find(activeNotificationFilter()).sort({ createdAt: -1 });
    
    // Filter out notifications that are read by the admin
    const unreadNotifications = notifications.filter(n => {
      const isRead = Boolean(n.read || (n.readBy || []).includes(req.user.id));
      return !isRead;
    });

    res.json(unreadNotifications.map((notification) => ({
      ...notification.toObject(),
      isRead: false,
    })));
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET MY NOTIFICATIONS (USER) ================= */
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $and: [
        { audience: { $ne: "admin" } },
        {
          $or: [
            { userId: req.user.id },
            { userId: { $exists: false } },
            { userId: null },
            { userId: "" }
          ]
        },
        {
          ...activeNotificationFilter()
        }
      ]
    }).sort({ createdAt: -1 });

    // Filter out read notifications so that marking them as read clears them
    const unreadNotifications = notifications.filter(n => {
      const isRead = Boolean(n.read || (n.readBy || []).includes(req.user.id));
      return !isRead;
    });
    
    res.json(unreadNotifications);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE NOTIFICATION (ADMIN) ================= */
export const updateNotification = async (req, res) => {
  try {
    const { title, message, type, expiresAt, audience, actionPath, data } = req.body;
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      {
        title,
        message,
        type,
        audience: audience === "admin" ? "admin" : "user",
        actionPath: actionPath || "",
        data: data || {},
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

    if (!notificationId) {
      // Mark all as read
      const filter = isAdmin(req.user)
        ? {}
        : {
            audience: { $ne: "admin" },
            $or: [
              { userId: req.user.id },
              { userId: { $exists: false } },
              { userId: null },
              { userId: "" }
            ]
          };

      const notifications = await Notification.find(filter);
      for (const notification of notifications) {
        if (notification.userId) {
          notification.read = true;
        }
        if (!notification.readBy) {
          notification.readBy = [];
        }
        if (!notification.readBy.includes(req.user.id)) {
          notification.readBy.push(req.user.id);
        }
        await notification.save();
      }
      return res.json({ success: true });
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      ...(isAdmin(req.user)
        ? {}
        : {
            audience: { $ne: "admin" },
            $or: [
              { userId: req.user.id },
              { userId: { $exists: false } },
              { userId: null },
              { userId: "" }
            ]
          })
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.userId) {
      notification.read = true;
    }
    if (!notification.readBy) {
      notification.readBy = [];
    }
    if (!(notification.readBy || []).includes(req.user.id)) {
      notification.readBy.push(req.user.id);
    }
    await notification.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
