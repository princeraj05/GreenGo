import Contact from "../models/Contact.js";
import { createAdminNotification } from "../services/adminNotificationService.js";
import { sendPushToAdmins } from "../utils/pushNotification.js";

export const createContact = async (req, res) => {
  try {
    const { name, email, subject, message, attachment } = req.body;
    const uid = req.user?.id || req.user?._id || req.user?.uid || null;

    const hasAttachment = attachment && attachment.url;

    const contact = await Contact.create({
      uid,
      source: uid ? "user" : "public",
      name,
      email,
      subject: subject || "",
      message: message || "",
      attachment: hasAttachment ? attachment : undefined,
      emailReplyStatus: uid ? "not_required" : "pending",
    });

    const displayMsg = message 
      ? message 
      : hasAttachment 
        ? `[Attachment: ${attachment.fileName || "File"}]`
        : "";

    await createAdminNotification({
      title: uid ? "New User Message" : "New Public Message",
      message: `${name || "Guest"} (${email || "No email"}): ${subject || "Message"} - ${String(displayMsg).slice(0, 120)}`,
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
      `${name || "Guest"}: ${subject || "Message"} - ${String(displayMsg).slice(0, 100)}`,
      { contactId: String(contact._id) }
    );

    const io = req.app.get("io");
    if (io) {
      io.to("admins").emit("support:new-message", contact.toObject ? contact.toObject() : contact);
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

export const markAllRepliesAsRead = async (req, res) => {
  try {
    const uid = req.user?.id || req.user?._id || req.user?.uid;
    if (!uid) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const contacts = await Contact.find({ uid });

    let updatedAny = false;
    for (const contact of contacts) {
      let contactUpdated = false;

      if (contact.replies && contact.replies.length > 0) {
        contact.replies.forEach((r) => {
          if (r.read !== true || r.status !== "read") {
            r.read = true;
            r.status = "read";
            r.readAt = r.readAt || new Date();
            r.deliveredAt = r.deliveredAt || new Date();
            contactUpdated = true;
          }
        });
      }

      if (contact.reply && contact.replyRead !== true) {
        contact.replyRead = true;
        contactUpdated = true;
      }

      if (contactUpdated) {
        await contact.save();
        updatedAny = true;
      }
    }

    const io = req.app.get("io");
    if (io) {
      io.to("admins").emit("support:read-status", { key: String(uid).toLowerCase(), readBy: "user" });
    }

    res.json({ success: true, message: "Messages marked as read" });
  } catch (err) {
    console.error("Failed to mark replies as read:", err);
    res.status(500).json({ success: false, message: "Failed to mark messages as read" });
  }
};
