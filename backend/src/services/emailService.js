import dns from "dns";

// Force IPv4 DNS resolution first (fixes ENETUNREACH IPv6 issues on Render/Heroku)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

let nodemailerInstance = null;
const getNodemailer = async () => {
  if (!nodemailerInstance) {
    const mod = await import("nodemailer");
    nodemailerInstance = mod.default || mod;
  }
  return nodemailerInstance;
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const isPublicEmailDomain = (email) => {
  const lowercase = String(email || "").toLowerCase();
  return (
    lowercase.includes("@gmail.") ||
    lowercase.includes("@yahoo.") ||
    lowercase.includes("@outlook.") ||
    lowercase.includes("@hotmail.") ||
    lowercase.includes("@icloud.") ||
    lowercase.includes("@aol.") ||
    lowercase.includes("@proton.") ||
    lowercase.includes("@zoho.")
  );
};

const getTransporter = async () => {
  const nodemailer = await getNodemailer();
  const host = process.env.SMTP_HOST;
  const service = process.env.SMTP_SERVICE || process.env.EMAIL_SERVICE || "gmail";
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.MAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.MAIL_PASS;

  if (!user || !pass) {
    throw new Error(
      "Email settings missing. Add EMAIL_USER and EMAIL_PASS, or SMTP_USER and SMTP_PASS."
    );
  }

  let activeHost = host;
  if (!activeHost && service && service.toLowerCase() === "gmail") {
    activeHost = "smtp.gmail.com";
  }
  let resolvedHost = activeHost;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true";

  if (activeHost) {
    try {
      const { address } = await dns.promises.lookup(activeHost, { family: 4 });
      resolvedHost = address;
      console.log(`DNS lookup: resolved ${activeHost} to IPv4 ${resolvedHost}`);
    } catch (dnsErr) {
      console.error(`DNS lookup failed for ${activeHost}, using host string directly:`, dnsErr);
    }
  }

  let transporterConfig;

  if (activeHost) {
    transporterConfig = {
      host: resolvedHost,
      port,
      secure,
      requireTLS: port === 587,
      auth: { user, pass },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,   // 10 seconds
      socketTimeout: 15000,     // 15 seconds
      tls: {
        servername: activeHost, // Make sure certificate validates the host name
      }
    };
  } else {
    transporterConfig = {
      service,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    };
  }

  const printHost = resolvedHost || `service:${service}`;
  console.log(`Configuring SMTP transporter: host/service=${printHost}, port=${port || "default"}, user=${user}`);

  return {
    transporter: nodemailer.createTransport(transporterConfig),
    host: printHost,
    port: port || "default",
  };
};

const sendMailViaNodemailer = async ({ from, to, replyTo, subject, text, html }) => {
  const nodemailer = await getNodemailer();
  const { transporter, host: activeHost, port: activePort } = await getTransporter();

  try {
    console.log(`Sending mail via standard SMTP ${activeHost}:${activePort}...`);
    return await transporter.sendMail({
      from,
      to,
      replyTo,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.warn(`SMTP send failed on ${activeHost}:${activePort}:`, err.message);

    const isDefaultPort587 = Number(activePort) === 587;
    const fallbackPort = isDefaultPort587 ? 465 : 587;
    const fallbackSecure = fallbackPort === 465;

    console.log(`Attempting SMTP fallback to port ${fallbackPort} (secure: ${fallbackSecure})...`);

    try {
      const host = process.env.SMTP_HOST;
      const service = process.env.SMTP_SERVICE || process.env.EMAIL_SERVICE || "gmail";
      const user = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.MAIL_USER;
      const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.MAIL_PASS;

      let fallbackHost = host;
      if (!fallbackHost && service && service.toLowerCase() === "gmail") {
        fallbackHost = "smtp.gmail.com";
      }

      let resolvedHost = fallbackHost;
      if (fallbackHost) {
        try {
          const { address } = await dns.promises.lookup(fallbackHost, { family: 4 });
          resolvedHost = address;
        } catch (dnsErr) {
          // ignore
        }
      }

      let fallbackConfig;
      if (resolvedHost) {
        fallbackConfig = {
          host: resolvedHost,
          port: fallbackPort,
          secure: fallbackSecure,
          requireTLS: fallbackPort === 587,
          auth: { user, pass },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
          tls: {
            servername: fallbackHost,
          }
        };
      } else {
        fallbackConfig = {
          service,
          auth: { user, pass },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
        };
      }

      const fallbackTransporter = nodemailer.createTransport(fallbackConfig);
      console.log(`Sending mail via fallback SMTP ${resolvedHost || service}:${fallbackPort}...`);
      return await fallbackTransporter.sendMail({
        from,
        to,
        replyTo,
        subject,
        text,
        html,
      });
    } catch (fallbackErr) {
      console.error(`SMTP fallback also failed:`, fallbackErr.message);
      throw err;
    }
  }
};

export const sendContactReplyEmail = async ({
  to,
  name,
  subject,
  reply,
  originalMessage,
}) => {
  const sender = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.MAIL_USER;
  const from = process.env.MAIL_FROM || `"GreenGo Support" <${sender || "support@greengo.app"}>`;
  const replyTo = process.env.ADMIN_REPLY_TO || sender || "support@greengo.app";
  const safeName = name || "there";

  const emailSubject = subject ? `GreenGo: ${subject}` : "GreenGo Support Reply";
  const emailText = [
    `Hi ${safeName},`,
    "",
    reply,
    "",
    "Your message:",
    originalMessage,
    "",
    "Regards,",
    "GreenGo Support",
  ].join("\n");

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <h2 style="color:#f97316;">GreenGo Support</h2>
      <p>Hi ${escapeHtml(safeName)},</p>
      <p>${escapeHtml(reply).replace(/\n/g, "<br />")}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="color:#6b7280;font-size:13px;">Your message:</p>
      <p style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px;">${escapeHtml(originalMessage).replace(/\n/g, "<br />")}</p>
      <p>Regards,<br />GreenGo Support</p>
    </div>
  `;

  const resendKey = process.env.RESEND_API_KEY || process.env.RESEND_API || process.env.resend_api;
  const brevoKey = process.env.BREVO_API_KEY || process.env.BREVO_API || process.env.brevo_api;

  // 1. Try Resend HTTP API if configured
  if (resendKey) {
    console.log("Attempting to send email via Resend API...");
    try {
      let cleanFrom = from;
      const senderEmail = sender || "";
      if (isPublicEmailDomain(senderEmail)) {
        console.log(`Sender "${senderEmail}" is on a public domain. Using Resend onboarding@resend.dev fallback.`);
        cleanFrom = `"GreenGo Support" <onboarding@resend.dev>`;
      }

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: cleanFrom,
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
  if (brevoKey) {
    console.log("Attempting to send email via Brevo API...");
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "api-key": brevoKey,
        },
        body: JSON.stringify({
          sender: {
            email: sender || "support@greengo.app",
            name: "GreenGo Support",
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
  return sendMailViaNodemailer({
    from,
    to,
    replyTo,
    subject: emailSubject,
    text: emailText,
    html: emailHtml,
  });
};

/* ================= GENERIC SEND EMAIL ================= */

export const sendEmail = async ({ to, subject, text, html }) => {
  const sender = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.MAIL_USER;
  const from = process.env.MAIL_FROM || `"GreenGo Support" <${sender || "support@greengo.app"}>`;
  const replyTo = process.env.ADMIN_REPLY_TO || sender || "support@greengo.app";

  const resendKey = process.env.RESEND_API_KEY || process.env.RESEND_API || process.env.resend_api;
  const brevoKey = process.env.BREVO_API_KEY || process.env.BREVO_API || process.env.brevo_api;

  // 1. Try Resend
  if (resendKey) {
    console.log("Attempting to send generic email via Resend API...");
    try {
      let cleanFrom = from;
      const senderEmail = sender || "";
      if (isPublicEmailDomain(senderEmail)) {
        cleanFrom = `"GreenGo Support" <onboarding@resend.dev>`;
      }
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: cleanFrom,
          to: [to],
          replyTo,
          subject,
          text,
          html,
        }),
      });
      const resData = await response.json();
      if (response.ok) {
        console.log("Generic email sent via Resend API.");
        return resData;
      } else {
        console.error("Resend API failed with status:", response.status, resData);
        throw new Error(resData?.message || `Resend API error: ${response.statusText || response.status}`);
      }
    } catch (err) {
      console.error("Resend sendEmail failed:", err);
      throw err;
    }
  }

  // 2. Try Brevo
  if (brevoKey) {
    console.log("Attempting to send generic email via Brevo API...");
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "api-key": brevoKey,
        },
        body: JSON.stringify({
          sender: { email: sender || "support@greengo.app", name: "GreenGo Support" },
          to: [{ email: to }],
          replyTo: { email: replyTo },
          subject,
          textContent: text,
          htmlContent: html,
        }),
      });
      const resData = await response.json();
      if (response.ok) {
        console.log("Generic email sent via Brevo API.");
        return resData;
      } else {
        console.error("Brevo API failed with status:", response.status, resData);
      }
    } catch (err) {
      console.error("Brevo sendEmail failed:", err);
    }
  }

  // 3. Nodemailer SMTP
  console.log("Attempting to send generic email via standard SMTP...");
  return sendMailViaNodemailer({
    from,
    to,
    replyTo,
    subject,
    text,
    html,
  });
};

