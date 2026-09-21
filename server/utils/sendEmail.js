const nodemailer = require("nodemailer");

const PLACEHOLDER_PATTERN = /^(your_|YOUR_)/;

// Gmail SMTP. EMAIL_PASS must be a Gmail App Password, not the account password.
// Google shows App Passwords as "abcd efgh ijkl mnop"; the spaces are not part of it.
const getCredentials = () => {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.replace(/\s+/g, "");
  return { user, pass };
};

const createTransporter = ({ user, pass }) =>
  nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

const sendEmail = async (email, subject, text, html) => {
  const credentials = getCredentials();

  if (!credentials.user || !credentials.pass) {
    console.warn("Email not sent: EMAIL_USER / EMAIL_PASS are not set in server/.env.");
    return false;
  }

  if (PLACEHOLDER_PATTERN.test(credentials.user) || PLACEHOLDER_PATTERN.test(credentials.pass)) {
    console.warn(
      "Email not sent: EMAIL_USER / EMAIL_PASS still contain placeholder text. " +
        "Put your Gmail address and a Gmail App Password in server/.env, then restart the server."
    );
    return false;
  }

  try {
    await createTransporter(credentials).sendMail({
      from: process.env.EMAIL_FROM || credentials.user,
      to: email,
      subject,
      text,
      html,
    });

    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    if (error.code === "EAUTH") {
      console.error(
        "Email not sent: Gmail rejected the login (EAUTH). EMAIL_PASS must be a Gmail App Password " +
          "(requires 2-Step Verification), not your normal Gmail password."
      );
    } else {
      console.error(`Email sending error (${error.code || "unknown"}):`, error.message);
    }
    return false;
  }
};

module.exports = sendEmail;
