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

  rewardPoints: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  favoriteCategory: { type: String, default: "" },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Food" }],
  blocked: { type: Boolean, default: false },

  lastLogin: {
    type: Date
  },

  role: {
    type: String,
    default: "user"
  }
},
{ timestamps: true }
);

export default mongoose.model("User", userSchema);
