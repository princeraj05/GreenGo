import Contact from "../models/Contact.js";
import { createAdminNotification } from "../services/adminNotificationService.js";
import { sendPushToAdmins } from "../utils/pushNotification.js";

export const createContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const uid = req.user?.id || req.user?._id || req.user?.uid || null;

    const contact = await Contact.create({
      uid,
      source: uid ? "user" : "public",
      name,
      email,
      subject: subject || "",
      message,
      emailReplyStatus: uid ? "not_required" : "pending",
    });

    await createAdminNotification({
      title: uid ? "New User Message" : "New Public Message",
      message: `${name || "Guest"} (${email || "No email"}): ${subject || "Message"} - ${String(message || "").slice(0, 120)}`,
      type: "info",
      actionPath: "/admin/contacts",
      data: {
        event: "user_message",
        contactId: String(contact._id),
        userId: uid ? String(uid) : "",
        name: name || "",
        email: email || "",
        subject: subject || "",
      },
    });
    sendPushToAdmins(
      uid ? "New User Message" : "New Public Message",
      `${name || "Guest"}: ${subject || "Message"} - ${String(message || "").slice(0, 100)}`,
      { contactId: String(contact._id) }
    );

    const io = req.app.get("io");
    if (io) {
      io.to("admins").emit("support:new-message", contact);
    }

    res.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

export const getMyContacts = async (req, res) => {
  try {
    const uid = req.user?.id || req.user?._id || req.user?.uid;
    const contacts = await Contact.find({ uid }).sort({ createdAt: 1 });

    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: "Failed to load contacts" });
  }
};
