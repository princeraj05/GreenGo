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
    enum:["Pending","Preparing","Out for Delivery","AcceptedByDeliveryBoy","RejectedByDeliveryBoy","Delivered","Cancelled"],
    default:"Pending"
  },

  etaMinutes:Number,
  etaSetAt:Date,
  assignedDeliveryBoy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  assignedAt: Date,
  assignmentStatus: {
    type: String,
    enum: ["Unassigned", "Assigned", "Accepted", "Rejected", "Delivered"],
    default: "Unassigned"
  },
  acceptedAt: Date,
  deliveredAt: Date,
  rejectedAt: Date,
  rejectionReason: { type: String, default: "" },
  distance:Number,
  latitude:Number,
  longitude:Number,
  tracking: {
    riderLocation: {
      lat: Number,
      lng: Number,
      updatedAt: Date
    }
  },
  customMessage:{ type: String, default: "" }

},
{timestamps:true}
);

export default mongoose.model("Order",orderSchema);
