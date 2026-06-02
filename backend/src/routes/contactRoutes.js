// ================= BACKEND =================
// ✅ routes/contactRoutes.js

import express from "express";
import {
  createContact,
  getMyContacts,
} from "../controllers/contactController.js";
import { protect, optionalProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

// send contact
router.post("/", optionalProtect, createContact);

// 🔥 get user contacts + admin reply
router.get("/my", protect, getMyContacts);

export default router;
