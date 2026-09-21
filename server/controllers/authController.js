const User = require("../models/User");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { frontendUrl } = require("../utils/frontendUrl");

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const MIN_PASSWORD_LENGTH = 6;
const INVALID_LINK_MESSAGE = "Invalid or expired reset link.";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const isString = (value) => typeof value === "string";

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body ?? {};

    if (![name, email, password].every(isString) || !name.trim() || !email.trim() || !password) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "Registration successful.",
    });
  } catch (error) {
    // Two simultaneous registrations can both pass the findOne check;
    // the unique index rejects the second one.
    if (error?.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    console.error("Registration error:", error);
    return res.status(500).json({
      message: "Unable to register user.",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email: rawEmail } = req.body ?? {};

    if (!isString(rawEmail) || !rawEmail.trim()) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    const email = rawEmail.trim().toLowerCase();
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "No account found with this email.",
      });
    }

    // The raw token only ever leaves the server in the reset link.
    // MongoDB stores just its SHA-256 hash.
    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetToken = hashToken(resetToken);
    user.resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save();

    const resetLink = `${frontendUrl()}/reset-password/${resetToken}`;

    const emailSent = await sendEmail(
      email,
      "Password Reset Request",
      [
        `Hi ${user.name},`,
        "",
        "We received a request to reset your password.",
        `Use this link to reset it: ${resetLink}`,
        "",
        "This link expires in 1 hour and can only be used once.",
        "If you did not request this, you can safely ignore this email.",
      ].join("\n"),
      `
        <p>Hi ${escapeHtml(user.name)},</p>
        <p>We received a request to reset your password.</p>
        <p><a href="${resetLink}">Click here to reset your password</a></p>
        <p>Or copy this link into your browser:<br>${resetLink}</p>
        <p>This link expires in 1 hour and can only be used once.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
      `
    );

    const returnResetLink = process.env.RETURN_RESET_LINK === "true";

    if (!emailSent && !returnResetLink) {
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;
      await user.save();

      return res.status(503).json({
        message: "Password reset email could not be sent. Please try again later.",
      });
    }

    const response = {
      message: emailSent
        ? "Password reset link sent to your email."
        : "Reset link generated, but the email could not be sent. Use the link below.",
    };

    if (returnResetLink) {
      response.resetLink = resetLink;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      message: "Unable to process the password reset request.",
    });
  }
};

const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      resetToken: hashToken(token),
      resetTokenExpiry: { $gt: new Date() },
    }).select("_id");

    if (!user) {
      return res.status(400).json({ message: INVALID_LINK_MESSAGE });
    }

    return res.status(200).json({
      message: "Reset link is valid.",
    });
  } catch (error) {
    console.error("Verify reset token error:", error);
    return res.status(500).json({
      message: "Unable to verify the reset link.",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body ?? {};

    if (!isString(password) || !password) {
      return res.status(400).json({
        message: "New password is required.",
      });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Validate the token, update the password and clear the token in ONE
    // atomic operation, so a reset link can never be used twice, even by
    // two simultaneous requests.
    const user = await User.findOneAndUpdate(
      {
        resetToken: hashToken(token),
        resetTokenExpiry: { $gt: new Date() },
      },
      {
        $set: { password: hashedPassword },
        $unset: { resetToken: "", resetTokenExpiry: "" },
      }
    ).select("_id");

    if (!user) {
      return res.status(400).json({ message: INVALID_LINK_MESSAGE });
    }

    return res.status(200).json({
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      message: "Unable to reset password.",
    });
  }
};

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]
  );
}

module.exports = {
  registerUser,
  forgotPassword,
  verifyResetToken,
  resetPassword,
};
