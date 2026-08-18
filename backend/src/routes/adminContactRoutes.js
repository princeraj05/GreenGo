// ================= BACKEND =================
// ✅ routes/adminContactRoutes.js

import express from "express";
import {
  getAllContacts,
  replyToContact,
  initiateContact,
  sendAdminEmail,
} from "../controllers/adminContactController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

// get all user contacts
router.get("/", protect, adminOnly, getAllContacts);

// initiate chat conversation with a user
router.post("/initiate", protect, adminOnly, initiateContact);

// send email directly to a user
router.post("/send-email", protect, adminOnly, sendAdminEmail);

// reply to a contact
router.post("/:id/reply", protect, adminOnly, replyToContact);

export default router;
