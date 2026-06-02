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
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,   // 10 seconds
      socketTimeout: 15000,     // 15 seconds
    });
  }

  return nodemailer.createTransport({
    service,
    auth: { user, pass },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,   // 10 seconds
    socketTimeout: 15000,     // 15 seconds
  });
};

export const sendContactReplyEmail = async ({
  to,
  name,
  subject,
  reply,
  originalMessage,
}) => {
  const sender = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.MAIL_USER;
  const from = process.env.MAIL_FROM || `"ByteBite Support" <${sender || "support@bytebite.com"}>`;
  const replyTo = process.env.ADMIN_REPLY_TO || sender || "support@bytebite.com";
  const safeName = name || "there";

  const emailSubject = subject ? `ByteBite: ${subject}` : "ByteBite Support Reply";
  const emailText = [
    `Hi ${safeName},`,
    "",
    reply,
    "",
    "Your message:",
    originalMessage,
    "",
    "Regards,",
    "ByteBite Support",
  ].join("\n");

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <h2 style="color:#f97316;">ByteBite Support</h2>
      <p>Hi ${escapeHtml(safeName)},</p>
      <p>${escapeHtml(reply).replace(/\n/g, "<br />")}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="color:#6b7280;font-size:13px;">Your message:</p>
      <p style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px;">${escapeHtml(originalMessage).replace(/\n/g, "<br />")}</p>
      <p>Regards,<br />ByteBite Support</p>
    </div>
  `;

  // 1. Try Resend HTTP API if configured
  if (process.env.RESEND_API_KEY) {
    console.log("Attempting to send email via Resend API...");
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: from.includes("<") ? from : `"ByteBite Support" <${from}>`,
          to: [to],
          replyTo: replyTo,
          subject: emailSubject,
          text: emailText,
          html: emailHtml,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData?.message || `Resend API error: ${response.statusText || response.status}`);
      }
      console.log("Email sent successfully via Resend API.");
      return resData;
    } catch (apiErr) {
      console.error("Resend API failed:", apiErr);
      throw apiErr;
    }
  }

  // 2. Try Brevo HTTP API if configured
  if (process.env.BREVO_API_KEY) {
    console.log("Attempting to send email via Brevo API...");
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "api-key": process.env.BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: {
            email: sender || "support@bytebite.com",
            name: "ByteBite Support",
          },
          to: [{ email: to, name: safeName }],
          replyTo: { email: replyTo },
          subject: emailSubject,
          textContent: emailText,
          htmlContent: emailHtml,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData?.message || `Brevo API error: ${response.statusText || response.status}`);
      }
      console.log("Email sent successfully via Brevo API.");
      return resData;
    } catch (apiErr) {
      console.error("Brevo API failed:", apiErr);
      throw apiErr;
    }
  }

  // 3. Fallback to Nodemailer SMTP
  console.log("Attempting to send email via standard SMTP...");
  const transporter = getTransporter();
  return transporter.sendMail({
    from,
    to,
    replyTo,
    subject: emailSubject,
    text: emailText,
    html: emailHtml,
  });
};
