import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: false
  },

  email: {
    type: String,
    unique: true,
    sparse: true,
    required: false
  },

  password: {
    type: String
  },

  uid: {
    type: String,
    default: ""
  },

  provider: {
    type: String,
    default: "email"
  },

  avatar: {
    type: String,
    default: ""
  },

  resetPasswordToken: {
    type: String,
    default: ""
  },

  resetPasswordExpire: {
    type: Date
  },

  phone: {
    type: String,
    default: ""
  },

  address: {
    type: String,
    default: ""
  },

  addresses: [{
    label: { type: String, default: "Home" },
    details: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    isPrimary: { type: Boolean, default: false }
  }],

  primaryAddressId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },

  foodPreference: {
    type: String,
    default: ""
  },

  deliveryTime: {
    type: String,
    default: ""
  },

  notifications: {
    type: String,
    default: ""
  },

  birthDate: {
    type: Date
  },

  deliveryDetails: {
    address: { type: String, default: "" },
    latitude: { type: Number },
    longitude: { type: Number },
    profileCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
    updatedAt: { type: Date },
    changeLog: [{
      field: { type: String, default: "" },
      oldValue: { type: String, default: "" },
      newValue: { type: String, default: "" },
      changedAt: { type: Date, default: Date.now }
    }]
  },

  rewardPoints: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  deliveryCredit: { type: Number, default: 0 },
  favoriteCategory: { type: String, default: "" },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Food" }],
  blocked: { type: Boolean, default: false },

  lastLogin: {
    type: Date
  },

  role: {
    type: String,
    enum: ["customer", "user", "deliveryBoy", "admin"],
    default: "customer"
  }
},
{ timestamps: true }
);

userSchema.index({ role: 1, blocked: 1, createdAt: -1 });
userSchema.index({ uid: 1 }, { sparse: true });
userSchema.index({ birthDate: 1 });
userSchema.index({ "deliveryDetails.profileCompleted": 1, role: 1 });

export default mongoose.model("User", userSchema);
