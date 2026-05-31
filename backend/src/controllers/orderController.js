import Order from "../models/Order.js";

/* ================= CREATE ORDER (USER) ================= */
export const createOrder = async (req, res) => {
  try {

    const {
      items,
      address,
      phone,
      paymentMethod,
      subtotal,
      deliveryCharge,
      total
    } = req.body;

    const order = await Order.create({
      userId: req.user.id,   // ✅ FIX (uid → id)

      items: items.map(i => ({
        foodId: i._id,
        name: i.name,
        price: i.price,
        qty: i.qty,
        image: i.image
      })),

      address,
      phone,
      paymentMethod,
      subtotal,
      deliveryCharge,
      total
    });

    res.json({
      success:true,
      order
    });

  } catch (err) {

    console.error("Create order error:",err);

    res.status(500).json({
      message:"Order failed"
    });

  }
};


/* ================= ADMIN – ALL ORDERS ================= */

export const getAllOrders = async (req,res)=>{
  const orders = await Order
  .find()
  .sort({createdAt:-1});

  res.json(orders);
};


/* ================= USER – MY ORDERS ================= */

export const getMyOrders = async (req,res)=>{

  const orders = await Order
  .find({userId:req.user.id})  // ✅ FIX
  .sort({createdAt:-1});

  res.json(orders);

};


import User from "../models/User.js";
import Food from "../models/Food.js";

/* ================= UPDATE STATUS ================= */

export const updateOrderStatus = async (req,res)=>{

  const {status,etaMinutes} = req.body;
  const orderId = req.params.id;

  try {
    const order = await Order.findById(orderId);
    if(!order) return res.status(404).json({message:"Order not found"});

    // Only apply stats when transitioning to Delivered
    if (status === "Delivered" && order.status !== "Delivered") {
      // 1. Update User Stats
      const user = await User.findById(order.userId);
      if(user){
        user.totalOrders = (user.totalOrders || 0) + 1;
        user.totalSpent = (user.totalSpent || 0) + order.total;
        user.rewardPoints = (user.rewardPoints || 0) + Math.floor(order.total / 10);
        await user.save();
      }

      // 2. Update Food Stats
      for (const item of order.items) {
        await Food.findByIdAndUpdate(item.foodId, {
          $inc: { totalOrders: item.qty, revenueGenerated: item.price * item.qty }
        });
      }
    }

    const update = {status};
    if(status!=="Delivered" && etaMinutes){
      update.etaMinutes = etaMinutes;
      update.etaSetAt = new Date();
    }
    if(status==="Delivered"){
      update.etaMinutes = null;
      update.etaSetAt = null;
    }

    await Order.findByIdAndUpdate(orderId, update);
    res.json({success:true});
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({message:"Server error"});
  }
};
