import express from "express";
import {
  registerUser,
  loginUser,
  loginWithPhonePassword,
  getMe,
  updateProfile,
  toggleFavorite,
  googleLogin,
  firebaseLogin,
  forgotPassword,
  resetPassword,
  sendOtpEmail,
  verifyOtpEmail,
  getBudgetRecommendations
} from "../controllers/userController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/login-phone", loginWithPhonePassword);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.post("/favorites/toggle", protect, toggleFavorite);
router.post("/budget-recommendations", protect, getBudgetRecommendations);
router.post("/google-login", googleLogin);
router.post("/firebase-login", firebaseLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.post("/send-otp-email", sendOtpEmail);
router.post("/verify-otp-email", verifyOtpEmail);

export default router;
