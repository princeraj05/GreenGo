import Contact from "../models/Contact.js";
import Notification from "../models/Notification.js";
import { sendContactReplyEmail, sendEmail } from "../services/emailService.js";
import { sendPushToUser } from "../utils/pushNotification.js";
import User from "../models/User.js";

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

    const io = req.app.get("io");
    if (io) {
      if (contact.uid) {
        io.to(`user:${contact.uid}`).emit("support:new-message", contact);
      }
      io.to("admins").emit("support:new-message", contact);
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

export const initiateContact = async (req, res) => {
  try {
    const { userId, message } = req.body;
    const cleanMessage = String(message || "").trim();

    if (!userId || !cleanMessage) {
      return res.status(400).json({ message: "userId and message are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if there is already an active contact for this user
    let contact = await Contact.findOne({ uid: String(user._id) }).sort({ createdAt: -1 });
    if (!contact) {
      contact = await Contact.create({
        uid: String(user._id),
        source: "user",
        name: user.name || "Customer",
        email: user.email || "No email",
        message: "Conversation initiated by Support",
        emailReplyStatus: "not_required",
      });
    }

    if (!contact.replies) {
      contact.replies = [];
    }

    contact.replies.push({
      reply: cleanMessage,
      repliedAt: new Date(),
      replyDelivery: "chat",
      emailReplyStatus: "not_required",
      emailReplyError: "",
    });

    contact.reply = cleanMessage;
    contact.repliedAt = new Date();
    contact.replyDelivery = "chat";
    contact.status = "Replied";

    await contact.save();

    await Notification.create({
      userId: String(user._id),
      title: "Support reply",
      message: `${cleanMessage.slice(0, 120)}${cleanMessage.length > 120 ? "..." : ""}`,
      type: "info",
    });

    sendPushToUser(
      String(user._id),
      "Support reply",
      `${cleanMessage.slice(0, 120)}${cleanMessage.length > 120 ? "..." : ""}`,
      { contactId: String(contact._id) }
    );

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${user._id}`).emit("support:new-message", contact);
      io.to("admins").emit("support:new-message", contact);
    }

    res.json({ success: true, contact });
  } catch (err) {
    console.error("Failed to initiate contact message:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const sendAdminEmail = async (req, res) => {
  try {
    const { userId, subject, message } = req.body;
    const cleanSubject = String(subject || "").trim();
    const cleanMessage = String(message || "").trim();

    if (!userId || !cleanSubject || !cleanMessage) {
      return res.status(400).json({ message: "userId, subject, and message are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.email) {
      return res.status(400).json({ message: "User does not have a registered email address" });
    }

    const sender = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.MAIL_USER;
    const replyTo = process.env.ADMIN_REPLY_TO || sender || "support@greengo.app";

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2 style="color:#22c55e;">GreenGo Support</h2>
        <p>Hi ${user.name || "there"},</p>
        <p>${cleanMessage.replace(/\n/g, "<br />")}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="color:#6b7280;font-size:12px;">This is a message from GreenGo Support. If you have any queries, please reply directly to this email.</p>
        <p>Regards,<br />GreenGo Support</p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: `GreenGo: ${cleanSubject}`,
      text: cleanMessage,
      html: emailHtml,
    });

    res.json({ success: true, message: `Email sent successfully to ${user.email}` });
  } catch (err) {
    console.error("Failed to send admin email:", err);
    res.status(500).json({ message: "Failed to send email. Check SMTP settings." });
  }
};
