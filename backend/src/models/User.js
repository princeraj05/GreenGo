import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
{
  name: {
    type:String,
    required:true
  },

  email:{
    type:String,
    unique:true,
    required:true
  },

  password:{
    type:String,
    required:true
  },

  phone: {
    type: String,
    default: ""
  },

  address: {
    type: String,
    default: ""
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
  blocked: { type: Boolean, default: false },

  role:{
    type:String,
    default:"user"
  }
},
{ timestamps:true }
);

export default mongoose.model("User", userSchema);
