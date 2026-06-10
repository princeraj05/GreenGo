import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  deliveryChargeAmount: { type: Number, default: 40 },
  isDeliveryChargeEnabled: { type: Boolean, default: true },
  deliveryChargeSlabs: [{
    upToKm: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  }],
  deliveryBoyAmountSlabs: [{
    upToKm: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  }],
  maxDeliveryDistance: { type: Number, default: 10 },
  storeLatitude: { type: Number, default: 25.5941 },
  storeLongitude: { type: Number, default: 85.1376 },
  isDistanceLimitEnabled: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Settings", settingsSchema);
