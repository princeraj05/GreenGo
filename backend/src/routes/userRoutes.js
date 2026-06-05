import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  toggleFavorite,
  googleLogin
} from "../controllers/userController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.post("/favorites/toggle", protect, toggleFavorite);
router.post("/google-login", googleLogin);

export default router;