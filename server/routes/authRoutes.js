const express = require("express");

const router = express.Router();

const {
  registerUser,
  forgotPassword,
  verifyResetToken,
  resetPassword,
} = require("../controllers/authController");

// Register -> Forgot Password -> Reset Password only. No login by design.
router.post("/register", registerUser);
router.post("/forgot-password", forgotPassword);
router.get("/verify-reset-token/:token", verifyResetToken);
router.post("/reset-password/:token", resetPassword);

module.exports = router;
