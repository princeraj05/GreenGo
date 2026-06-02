import Contact from "../models/Contact.js";
import { sendContactReplyEmail } from "../services/emailService.js";

const getSafeEmailError = (error) => {
  console.error("Original email sending error details:", error);
  const message = String(error?.message || error || "");

  if (
    message.includes("Email settings missing") ||
    message.includes("SMTP settings missing")
  ) {
    return "Email setup missing on backend.";
  }

  if (message.includes("Invalid login") || message.includes("Username and Password not accepted")) {
    return "Email login failed. Check credentials.";
  }

  if (message.includes("ETIMEDOUT") || message.includes("timeout") || message.includes("ENETUNREACH")) {
    return "SMTP port blocked on host. Please configure RESEND_API_KEY or BREVO_API_KEY on Render.";
  }

  return "Email delivery failed. Please check SMTP settings.";
};

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
    contact.status = "Replied";

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
        contact.emailReplyError = getSafeEmailError(emailErr);
        await contact.save();
        return res.json({
          success: true,
          emailSent: false,
          message: "Reply saved, but email could not be sent.",
          error: contact.emailReplyError,
        });
      }
    } else {
      contact.emailReplyStatus = "not_required";
      contact.emailReplyError = "";
    }

    await contact.save();

    res.json({
      success: true,
      emailSent: shouldSendEmail,
      message: shouldSendEmail
        ? "Reply sent to user's email"
        : "Reply sent to user's chat",
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to send reply" });
  }
};
