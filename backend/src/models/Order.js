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
  packingCharge:{ type: Number, default: 0 },
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
  deliveryBoyAmount:{ type: Number, default: 0 },
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

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ assignedDeliveryBoy: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ assignedDeliveryBoy: 1, paymentMethod: 1, createdAt: -1 });

export default mongoose.model("Order",orderSchema);
