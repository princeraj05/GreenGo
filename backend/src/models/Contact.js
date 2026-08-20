import mongoose from "mongoose";
import { encryptText, decryptText } from "../config/cryptoHelper.js";

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
    message: { type: String, default: "" },
    attachment: {
      type: { type: String, enum: ["image", "file"], default: "file" },
      url: { type: String },
      fileName: { type: String },
      mimeType: { type: String },
      size: { type: Number },
      uploadedAt: { type: Date, default: Date.now }
    },
    read: { type: Boolean, default: false },
    messageStatus: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
    readAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },

    reply: { type: String, default: "" },
    replyRead: { type: Boolean, default: false },
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
    replies: [
      {
        reply: { type: String, default: "" },
        repliedAt: { type: Date, default: Date.now },
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
        attachment: {
          type: { type: String, enum: ["image", "file"], default: "file" },
          url: { type: String },
          fileName: { type: String },
          mimeType: { type: String },
          size: { type: Number },
          uploadedAt: { type: Date, default: Date.now }
        },
        read: { type: Boolean, default: false },
        status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
        readAt: { type: Date, default: null },
        deliveredAt: { type: Date, default: null },
      },
    ],
    status: {
      type: String,
      enum: ["Pending", "Replied"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

// Mongoose hooks for automatic encryption and decryption
contactSchema.pre("save", function (next) {
  if (this.isModified("message") && this.message) {
    this.message = encryptText(this.message);
  }
  if (this.isModified("reply") && this.reply) {
    this.reply = encryptText(this.reply);
  }
  if (this.replies && this.replies.length > 0) {
    this.replies.forEach((r) => {
      if (r.reply && r.reply.split(":").length !== 3) {
        r.reply = encryptText(r.reply);
      }
    });
  }
  next();
});

// Decrypt fields after querying
contactSchema.post("init", function (doc) {
  if (doc.message) {
    doc.message = decryptText(doc.message);
  }
  if (doc.reply) {
    doc.reply = decryptText(doc.reply);
  }
  if (doc.replies && doc.replies.length > 0) {
    doc.replies.forEach((r) => {
      if (r.reply) {
        r.reply = decryptText(r.reply);
      }
    });
  }
});

contactSchema.index({ uid: 1, createdAt: 1 });
contactSchema.index({ email: 1, createdAt: -1 });
contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ replyDelivery: 1, createdAt: -1 });

export default mongoose.model("Contact", contactSchema);
