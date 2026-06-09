import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  createOrder,
  acceptAssignedOrder,
  assignDeliveryBoy,
  getAssignedOrders,
  getAllOrders,
  getDeliveryBoys,
  getDeliveryDashboard,
  getDeliveryEarnings,
  getMyOrders,
  markAssignedOrderDelivered,
  rejectAssignedOrder,
  updateOrderStatus
} from "../controllers/orderController.js";

const router = express.Router();

/* USER */
router.post("/",protect,createOrder);
router.get("/my",protect,getMyOrders);

/* ADMIN */
router.get("/delivery-boys",protect,getDeliveryBoys);
router.get("/",protect,getAllOrders);
router.put("/:id/assign-delivery",protect,assignDeliveryBoy);
router.put("/:id/status",protect,updateOrderStatus);

/* DELIVERY BOY */
router.get("/delivery/dashboard",protect,getDeliveryDashboard);
router.get("/delivery/assigned",protect,getAssignedOrders);
router.get("/delivery/earnings",protect,getDeliveryEarnings);
router.put("/delivery/:id/accept",protect,acceptAssignedOrder);
router.put("/delivery/:id/reject",protect,rejectAssignedOrder);
router.put("/delivery/:id/delivered",protect,markAssignedOrderDelivered);

export default router;
