import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    token: { type: String, required: true },
    deviceName: { type: String, default: "Unknown Device" },
    browser: { type: String, default: "Unknown Browser" },
    os: { type: String, default: "Unknown OS" },
    ipAddress: { type: String, default: "" },
    location: { type: String, default: "" },
    loginTime: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

sessionSchema.index({ userId: 1 });
sessionSchema.index({ token: 1 }, { unique: true });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Session", sessionSchema);
