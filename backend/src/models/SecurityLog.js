import mongoose from "mongoose";

const securityLogSchema = new mongoose.Schema(
  {
    userId: { type: String, default: null },
    action: { type: String, required: true },
    details: { type: String, required: true },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

// Enforce immutable logs at model-level middleware
securityLogSchema.pre("save", function (next) {
  if (!this.isNew) {
    return next(new Error("SecurityLog updates are strictly blocked. Logs are append-only."));
  }
  next();
});

securityLogSchema.pre("updateOne", function (next) {
  next(new Error("SecurityLog updates are strictly blocked. Logs are append-only."));
});

securityLogSchema.pre("updateMany", function (next) {
  next(new Error("SecurityLog updates are strictly blocked. Logs are append-only."));
});

securityLogSchema.pre("findOneAndUpdate", function (next) {
  next(new Error("SecurityLog updates are strictly blocked. Logs are append-only."));
});

securityLogSchema.pre("remove", function (next) {
  next(new Error("SecurityLog deletions are strictly blocked."));
});

securityLogSchema.pre("deleteOne", function (next) {
  next(new Error("SecurityLog deletions are strictly blocked."));
});

securityLogSchema.pre("deleteMany", function (next) {
  next(new Error("SecurityLog deletions are strictly blocked."));
});

securityLogSchema.pre("findOneAndDelete", function (next) {
  next(new Error("SecurityLog deletions are strictly blocked."));
});

securityLogSchema.index({ userId: 1, timestamp: -1 });
securityLogSchema.index({ action: 1, timestamp: -1 });

export default mongoose.model("SecurityLog", securityLogSchema);
