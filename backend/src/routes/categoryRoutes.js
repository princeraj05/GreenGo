import express from "express";
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory
} from "../controllers/categoryController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.get("/", getCategories);

router.post(
  "/",
  protect,
  adminOnly,
  upload.single("image"),
  addCategory
);

router.put(
  "/:id",
  protect,
  adminOnly,
  upload.single("image"),
  updateCategory
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteCategory
);

export default router;
