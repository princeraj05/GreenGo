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
  const service = process.env.SMTP_SERVICE || process.env.EMAIL_SERVICE || "gmail";
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.MAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.MAIL_PASS;

  if (!user || !pass) {
    throw new Error(
      "Email settings missing. Add EMAIL_USER and EMAIL_PASS, or SMTP_USER and SMTP_PASS."
    );
  }

  if (host) {
    return nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    service,
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
  const sender = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.MAIL_USER;
  const from = process.env.MAIL_FROM || `"ByteBite Support" <${sender}>`;
  const replyTo = process.env.ADMIN_REPLY_TO || sender;
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
