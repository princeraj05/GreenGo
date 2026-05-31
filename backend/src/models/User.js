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

  role:{
    type:String,
    default:"user"
  }
},
{ timestamps:true }
);

export default mongoose.model("User", userSchema);
