import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
{
  foodId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Food",
    required:true
  },

  name:String,
  price:Number,
  qty:Number,
  image:String

},
{_id:false}
);

const orderSchema = new mongoose.Schema(
{

  userId:{
    type:String,
    required:true
  },

  items:[orderItemSchema],

  address:String,
  phone:String,
  paymentMethod:{ type: String, default: "COD" },

  subtotal:Number,
  deliveryCharge:Number,
  total:Number,

  status:{
    type:String,
    enum:["Pending","Preparing","Delivered"],
    default:"Pending"
  },

  etaMinutes:Number,
  etaSetAt:Date,
  distance:Number,
  latitude:Number,
  longitude:Number,
  customMessage:{ type: String, default: "" }

},
{timestamps:true}
);

export default mongoose.model("Order",orderSchema);
