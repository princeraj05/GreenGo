import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: String }, // Optional for global broadcast
    title: { type: String, default: "Notification" },
    message: { type: String, required: true },
    type: { type: String, default: "info" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
