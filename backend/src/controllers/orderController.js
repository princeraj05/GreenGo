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


/* ================= UPDATE STATUS ================= */

export const updateOrderStatus = async (req,res)=>{

  const {status,etaMinutes} = req.body;

  const update = {status};

  if(status!=="Delivered" && etaMinutes){
    update.etaMinutes = etaMinutes;
    update.etaSetAt = new Date();
  }

  if(status==="Delivered"){
    update.etaMinutes = null;
    update.etaSetAt = null;
  }

  await Order.findByIdAndUpdate(req.params.id,update);

  res.json({success:true});

};
