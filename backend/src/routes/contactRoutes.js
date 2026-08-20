// ================= BACKEND =================
// ✅ routes/contactRoutes.js

import express from "express";
import {
  createContact,
  getMyContacts,
  markAllRepliesAsRead,
} from "../controllers/contactController.js";
import { protect, optionalProtect } from "../middleware/authMiddleware.js";
import { chatUpload } from "../middleware/upload.js";

const router = express.Router();

// mark all admin replies as read
router.patch("/read", protect, markAllRepliesAsRead);

// send contact
router.post("/", optionalProtect, createContact);

// 🔥 get user contacts + admin reply
router.get("/my", protect, getMyContacts);

// file upload for chat
router.post("/upload", protect, (req, res, next) => {
  chatUpload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    res.json({
      success: true,
      attachment: {
        type: req.file.mimetype.startsWith("image/") ? "image" : "file",
        url: req.file.path || req.file.secure_url,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size
      }
    });
  });
});

export default router;
