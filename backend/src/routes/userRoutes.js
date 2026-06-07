import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  toggleFavorite,
  googleLogin,
  forgotPassword,
  resetPassword,
  sendOtpEmail,
  verifyOtpEmail,
  sendOtpPhone,
  verifyOtpPhone
} from "../controllers/userController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.post("/favorites/toggle", protect, toggleFavorite);
router.post("/google-login", googleLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.post("/send-otp-email", sendOtpEmail);
router.post("/verify-otp-email", verifyOtpEmail);
router.post("/send-otp-phone", sendOtpPhone);
router.post("/verify-otp-phone", verifyOtpPhone);

export default router;