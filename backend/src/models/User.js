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

  phoneEncrypted: {
    type: String,
    default: ""
  },

  phoneHash: {
    type: String,
    sparse: true,
    index: { unique: true, partialFilterExpression: { phoneHash: { $exists: true, $ne: null } } }
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

  profileCompletion: {
    passwordSet: { type: Boolean, default: false },
    editProfileCompleted: { type: Boolean, default: false },
    addressCompleted: { type: Boolean, default: false },
    completionPercent: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    updatedAt: { type: Date }
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

  lastActivity: {
    type: Date,
    default: Date.now
  },

  failedLoginAttempts: {
    type: Number,
    default: 0
  },

  lockoutUntil: {
    type: Date,
    default: null
  },

  isDeleted: {
    type: Boolean,
    default: false
  },

  deletedAt: {
    type: Date,
    default: null
  },

  twoFactorSecret: {
    type: String,
    default: ""
  },

  twoFactorEnabled: {
    type: Boolean,
    default: false
  },

  privacyPolicyAcceptedAt: {
    type: Date,
    default: null
  },

  termsAcceptedAt: {
    type: Date,
    default: null
  },

  privacyPolicyVersion: {
    type: String,
    default: ""
  },

  termsVersion: {
    type: String,
    default: ""
  },

  role: {
    type: String,
    enum: ["customer", "deliveryBoy", "admin"],
    default: "customer"
  },
  
  isOnline: {
    type: Boolean,
    default: false
  },
  
  fcmTokens: {
    type: [String],
    default: []
  }
},
{ timestamps: true }
);

userSchema.index({ role: 1, blocked: 1, createdAt: -1 });
userSchema.index({ uid: 1 }, { sparse: true });
userSchema.index({ birthDate: 1 });
userSchema.index({ "deliveryDetails.profileCompleted": 1, role: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ lastActivity: 1 });

export default mongoose.model("User", userSchema);
