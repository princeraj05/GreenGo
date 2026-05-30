import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  deliveryChargeAmount: { type: Number, default: 40 },
  isDeliveryChargeEnabled: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Settings", settingsSchema);
