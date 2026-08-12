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
  storeLatitude: { type: Number, default: 25.512098 },
  storeLongitude: { type: Number, default: 86.552263 },
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
  referralRewardReferrer: { type: Number, default: 20 },
  minOrderAmount: { type: Number, default: 0 },
  isBirthdayOfferEnabled: { type: Boolean, default: true },
  birthdayCouponAmount: { type: Number, default: 50 }
}, { timestamps: true });

export default mongoose.model("Settings", settingsSchema);
