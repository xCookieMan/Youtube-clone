import nodemailer from "nodemailer";

/* ================= CREATE TRANSPORTER ================= */
const createTransporter = () => {
  const { EMAIL_USER, EMAIL_APP_PASSWORD } = process.env;

  if (!EMAIL_USER || !EMAIL_APP_PASSWORD) {
    throw new Error("Missing EMAIL_USER or EMAIL_APP_PASSWORD in .env");
  }

  return nodemailer.createTransport({
    service: "gmail", // ✅ Gmail shortcut
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_APP_PASSWORD,
    },
  });
};

/* ================= SEND EMAIL ================= */
export const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"YouTube Clone" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text: text || undefined,
    html: html || undefined,
  };

  // Optional: verify transporter in development
  if (process.env.NODE_ENV === "development") {
    try {
      await transporter.verify();
      console.log("📧 Email transporter verified");
    } catch (err) {
      console.warn("⚠️ Transporter verification failed:", err.message);
    }
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Email sent to ${to} (messageId: ${info.messageId})`);
    return info;
  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
    throw new Error(
      "Failed to send email. Please check your credentials or network."
    );
  }
};
