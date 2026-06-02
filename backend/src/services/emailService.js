import nodemailer from "nodemailer";

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP settings missing. Add SMTP_HOST, SMTP_USER and SMTP_PASS.");
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
};

export const sendContactReplyEmail = async ({
  to,
  name,
  subject,
  reply,
  originalMessage,
}) => {
  const transporter = getTransporter();
  const from = process.env.MAIL_FROM || `"ByteBite Support" <${process.env.SMTP_USER}>`;
  const replyTo = process.env.ADMIN_REPLY_TO || process.env.SMTP_USER;
  const safeName = name || "there";

  return transporter.sendMail({
    from,
    to,
    replyTo,
    subject: subject ? `ByteBite: ${subject}` : "ByteBite Support Reply",
    text: [
      `Hi ${safeName},`,
      "",
      reply,
      "",
      "Your message:",
      originalMessage,
      "",
      "Regards,",
      "ByteBite Support",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2 style="color:#f97316;">ByteBite Support</h2>
        <p>Hi ${escapeHtml(safeName)},</p>
        <p>${escapeHtml(reply).replace(/\n/g, "<br />")}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="color:#6b7280;font-size:13px;">Your message:</p>
        <p style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px;">${escapeHtml(originalMessage).replace(/\n/g, "<br />")}</p>
        <p>Regards,<br />ByteBite Support</p>
      </div>
    `,
  });
};
