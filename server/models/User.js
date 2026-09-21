const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // bcrypt hash, never the plaintext password.
    password: {
      type: String,
      required: true,
    },

    // SHA-256 hash of the reset token, never the raw token.
    resetToken: {
      type: String,
    },

    resetTokenExpiry: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
