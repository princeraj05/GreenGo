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
  image:String,
  variant: { type: String, default: "" },
  taxAtPurchase: { type: Number, default: 0 }

},
{_id:false}
);

const orderSchema = new mongoose.Schema(
{

  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  },

  items:[orderItemSchema],

  address:String,
  phone:String,
  paymentMethod:{ type: String, default: "COD" },

  subtotal:Number,
  deliveryCharge:Number,
  deliveryBoyAmount:{ type: Number, default: 0 },
  rainCharge: { type: Number, default: 0 },
  festivalCharge: { type: Number, default: 0 },
  platformCharge: { type: Number, default: 0 },
  surcharges: [{
    name: String,
    amount: Number
  }],
  surchargesAmount: { type: Number, default: 0 },
  total:Number,

  status:{
    type:String,
    enum:["PaymentPending","Pending","RestaurantAccepted","Preparing","Out for Delivery","AcceptedByDeliveryBoy","RejectedByDeliveryBoy","Delivered","Cancelled","CancellationRequested"],
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
  transactionId: { type: String, default: "" },
  cancellationReason: { type: String, default: "" },
  cancellationCustomMessage: { type: String, default: "" },
  cancellationStatus: { type: String, enum: ["None", "Pending", "Approved", "Rejected"], default: "None" },
  cancelledAt: Date,
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
  customMessage:{ type: String, default: "" },
  couponCode: { type: String, default: "" },
  discountAmount: { type: Number, default: 0 },
  razorpayOrderId: { type: String, default: null },
  razorpayPaymentId: { type: String, default: null },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed", "Refunded"],
    default: "Pending"
  },
  invoiceGenerated: {
    type: Boolean,
    default: false
  }

},
{timestamps:true}
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ assignedDeliveryBoy: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ assignedDeliveryBoy: 1, paymentMethod: 1, createdAt: -1 });
orderSchema.index(
  { razorpayOrderId: 1 },
  { unique: true, partialFilterExpression: { razorpayOrderId: { $exists: true, $ne: null } } }
);
orderSchema.index(
  { razorpayPaymentId: 1 },
  { unique: true, partialFilterExpression: { razorpayPaymentId: { $exists: true, $ne: null } } }
);

export default mongoose.model("Order",orderSchema);
