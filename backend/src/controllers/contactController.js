// ================= BACKEND =================
// ✅ controllers/contactController.js

import Contact from "../models/Contact.js";

// CREATE CONTACT (already working)
export const createContact = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    await Contact.create({
      uid: req.user ? req.user.id || req.user.uid : null,
      name,
      email,
      message,
    });

    res.json({
      success: true,
      message: "✅ Message sent successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "❌ Failed to send message",
    });
  }
};

// 🔥 GET USER CONTACTS + ADMIN REPLY
export const getMyContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({ uid: req.user.uid })
      .sort({ createdAt: -1 });

    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: "Failed to load contacts" });
  }
};
