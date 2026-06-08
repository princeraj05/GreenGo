import Order from "../models/Order.js";
import Settings from "../models/Settings.js";

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const geocodeAddress = async (addrStr) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addrStr)}&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ByteBite-FoodDelivery-App/1.0" }
    });
    const data = await res.json();
    if (data && data.length > 0) {
      return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
    }
  } catch (err) {
    console.error("Geocoding failed on backend:", err);
  }
  return null;
};

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
      total,
      latitude,
      longitude,
      customMessage
    } = req.body;

    let userLat = latitude;
    let userLon = longitude;

    // If coordinates are not provided, try to geocode the address
    if ((userLat === undefined || userLat === null) && address) {
      const coords = await geocodeAddress(address);
      if (coords) {
        userLat = coords.latitude;
        userLon = coords.longitude;
      }
    }

    let distance = null;
    const settings = await Settings.findOne();
    if (settings && userLat !== undefined && userLat !== null && userLon !== undefined && userLon !== null) {
      distance = calculateHaversineDistance(
        settings.storeLatitude,
        settings.storeLongitude,
        userLat,
        userLon
      );

      // Verify delivery distance limit if enabled
      if (settings.isDistanceLimitEnabled && distance > settings.maxDeliveryDistance) {
        return res.status(400).json({
          message: `Delivery is not available. Your location is ${distance.toFixed(1)} km away, which exceeds our maximum delivery distance of ${settings.maxDeliveryDistance} km.`
        });
      }
    }

    const order = await Order.create({
      userId: req.user.id,

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
      total,
      distance: distance ? Number(distance.toFixed(2)) : null,
      latitude: userLat,
      longitude: userLon,
      customMessage: customMessage || ""
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
