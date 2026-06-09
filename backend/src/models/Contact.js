import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    uid: { type: String },
    source: {
      type: String,
      enum: ["user", "public"],
      default: "public",
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, default: "" },
    message: { type: String, required: true },

    reply: { type: String },
    repliedAt: { type: Date },
    replyDelivery: {
      type: String,
      enum: ["chat", "email", ""],
      default: "",
    },
    emailReplyStatus: {
      type: String,
      enum: ["not_required", "pending", "sent", "failed", ""],
      default: "",
    },
    emailReplyError: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Replied"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

contactSchema.index({ uid: 1, createdAt: 1 });
contactSchema.index({ email: 1, createdAt: -1 });
contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ replyDelivery: 1, createdAt: -1 });

export default mongoose.model("Contact", contactSchema);
