import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: String }, // Optional for global broadcast
    title: { type: String, default: "Notification" },
    message: { type: String, required: true },
    type: { type: String, default: "info" },
    audience: { type: String, enum: ["user", "admin"], default: "user" },
    actionPath: { type: String, default: "" },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
    readBy: [{ type: String }],
    expiresAt: { type: Date }
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ audience: 1, createdAt: -1 });
notificationSchema.index({ read: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ "data.event": 1, "data.userId": 1, "data.date": 1 });

notificationSchema.post("save", async function(doc) {
  try {
    // Dynamic import to avoid circular dependency
    const { sendPushToUser, sendPushToAllUsers, sendPushToAdmins } = await import("../utils/pushNotification.js");

    const title = doc.title || "Notification";
    const body = doc.message;
    const data = doc.data || {};

    if (doc.userId) {
      // Send push notification to a specific user
      await sendPushToUser(doc.userId, title, body, data);
    } else {
      // Global broadcast or group notification
      if (doc.audience === "admin") {
        await sendPushToAdmins(title, body, data);
      } else {
        await sendPushToAllUsers(title, body, data);
      }
    }
  } catch (err) {
    console.error("[NOTIFICATION SCHEMA HOOK] Failed to trigger push notification:", err);
  }
});

export default mongoose.model("Notification", notificationSchema);
