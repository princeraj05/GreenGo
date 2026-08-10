import Contact from "../models/Contact.js";
import Notification from "../models/Notification.js";
import { sendContactReplyEmail } from "../services/emailService.js";
import { sendPushToUser } from "../utils/pushNotification.js";

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

    // Initialize or migrate legacy reply to the replies array
    if (!contact.replies) {
      contact.replies = [];
    }
    if (contact.reply && contact.replies.length === 0) {
      contact.replies.push({
        reply: contact.reply,
        repliedAt: contact.repliedAt || contact.updatedAt || new Date(),
        replyDelivery: contact.replyDelivery || "chat",
        emailReplyStatus: contact.emailReplyStatus || "not_required",
        emailReplyError: contact.emailReplyError || "",
      });
    }

    const newReplyObj = {
      reply: cleanReply,
      repliedAt: new Date(),
      replyDelivery: shouldSendEmail ? "email" : "chat",
      emailReplyStatus: shouldSendEmail ? "pending" : "not_required",
      emailReplyError: "",
    };

    contact.replies.push(newReplyObj);

    // Maintain legacy fields for compatibility
    contact.reply = cleanReply;
    contact.repliedAt = newReplyObj.repliedAt;
    contact.replyDelivery = newReplyObj.replyDelivery;
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

        // Also update status details inside the replies array
        const lastIdx = contact.replies.length - 1;
        contact.replies[lastIdx].emailReplyStatus = "sent";
        contact.replies[lastIdx].emailReplyError = "";
      } catch (emailErr) {
        contact.emailReplyStatus = "failed";
        contact.emailReplyError = getSafeEmailError(emailErr);

        // Also update status details inside the replies array
        const lastIdx = contact.replies.length - 1;
        contact.replies[lastIdx].emailReplyStatus = "failed";
        contact.replies[lastIdx].emailReplyError = contact.emailReplyError;

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

      const lastIdx = contact.replies.length - 1;
      contact.replies[lastIdx].emailReplyStatus = "not_required";
      contact.replies[lastIdx].emailReplyError = "";
    }

    await contact.save();

    if (contact.uid) {
      await Notification.create({
        userId: contact.uid,
        title: "Support reply",
        message: `Admin replied to your message: ${cleanReply.slice(0, 120)}${cleanReply.length > 120 ? "..." : ""}`,
        type: "info",
      });
      sendPushToUser(
        contact.uid,
        "Support reply",
        `Admin replied to your message: ${cleanReply.slice(0, 120)}${cleanReply.length > 120 ? "..." : ""}`,
        { contactId: String(contact._id) }
      );
    }

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
