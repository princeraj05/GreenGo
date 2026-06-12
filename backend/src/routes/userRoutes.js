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
  getBudgetRecommendations,
  downloadUserData,
  requestAccountDeletion,
  getActiveSessions,
  revokeSession,
  revokeAllSessions,
  getSecurityLogs
} from "../controllers/userController.js";

import { protect } from "../middleware/authMiddleware.js";
import { rateLimitLogin } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/login-phone", rateLimitLogin, loginWithPhonePassword);
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

// Privacy Center & Sessions Management
router.get("/download-data", protect, downloadUserData);
router.post("/request-delete", protect, requestAccountDeletion);
router.get("/sessions", protect, getActiveSessions);
router.delete("/sessions/:sessionId", protect, revokeSession);
router.delete("/sessions", protect, revokeAllSessions);

// Security logs (Admin Only)
router.get("/security-logs", protect, getSecurityLogs);

export default router;
