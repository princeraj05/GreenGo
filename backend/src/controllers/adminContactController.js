import Contact from "../models/Contact.js";
import { sendContactReplyEmail } from "../services/emailService.js";

export const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch contacts" });
  }
};

export const replyToContact = async (req, res) => {
  try {
    const cleanReply = String(req.body.reply || "").trim();

    if (!cleanReply) {
      return res.status(400).json({ message: "Reply is required" });
    }

    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    const shouldSendEmail = !contact.uid || contact.source === "public";

    contact.reply = cleanReply;
    contact.repliedAt = new Date();
    contact.replyDelivery = shouldSendEmail ? "email" : "chat";

    if (shouldSendEmail) {
      try {
        await sendContactReplyEmail({
          to: contact.email,
          name: contact.name,
          subject: contact.subject,
          reply: cleanReply,
          originalMessage: contact.message,
        });
        contact.emailReplyStatus = "sent";
        contact.emailReplyError = "";
      } catch (emailErr) {
        contact.emailReplyStatus = "failed";
        contact.emailReplyError = emailErr.message;
        await contact.save();
        return res.status(500).json({
          message: "Reply saved, but email could not be sent",
          error: emailErr.message,
        });
      }
    } else {
      contact.emailReplyStatus = "not_required";
      contact.emailReplyError = "";
    }

    await contact.save();

    res.json({
      success: true,
      message: shouldSendEmail
        ? "Reply sent to user's email"
        : "Reply sent to user's chat",
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to send reply" });
  }
};
