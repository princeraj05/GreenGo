import express from "express";
import {
getAllUsers,
updateUserStatus,
updateUserRole
} from "../controllers/adminUserController.js";

import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/",protect,adminOnly,getAllUsers);

router.put("/:id/status",protect,adminOnly,updateUserStatus);
router.put("/:id/role",protect,adminOnly,updateUserRole);

export default router;
