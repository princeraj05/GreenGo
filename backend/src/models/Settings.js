import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  deliveryChargeAmount: { type: Number, default: 40 },
  isDeliveryChargeEnabled: { type: Boolean, default: true },
  deliveryChargeSlabs: [{
    upToKm: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    cod: { type: Boolean, default: true },
    online: { type: Boolean, default: true }
  }],
  deliveryBoyAmountSlabs: [{
    upToKm: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  }],
  maxDeliveryDistance: { type: Number, default: 10 },
  storeLatitude: { type: Number, default: 25.5941 },
  storeLongitude: { type: Number, default: 85.1376 },
  isDistanceLimitEnabled: { type: Boolean, default: true },
  isStoreOpen: { type: Boolean, default: false },
  rainCharge: { type: Number, default: 0 },
  festivalCharge: { type: Number, default: 0 },
  platformCharge: { type: Number, default: 0 },
  enabledPaymentMethods: {
    cod: { type: Boolean, default: true },
    online: { type: Boolean, default: true }
  },
  surcharges: {
    type: [{
      name: { type: String, required: true },
      amount: { type: Number, default: 0 },
      cod: { type: Boolean, default: true },
      online: { type: Boolean, default: true }
    }],
    default: []
  },
  referralRewardFriend: { type: Number, default: 50 },
  referralRewardReferrer: { type: Number, default: 20 }
}, { timestamps: true });

export default mongoose.model("Settings", settingsSchema);
