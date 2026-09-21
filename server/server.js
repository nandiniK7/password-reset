// Single env-loading path: always server/.env, regardless of the directory
// the process is started from. Must run before any module reads process.env.
require("dotenv").config({ path: require("path").join(__dirname, ".env"), quiet: true });

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const { frontendUrl, PRODUCTION_FRONTEND_URL } = require("./utils/frontendUrl");

const app = express();
const PORT = Number(process.env.PORT || 5000);

// Origins are compared exactly as browsers send them (no trailing slash).
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  PRODUCTION_FRONTEND_URL,
  frontendUrl(),
];

const allowedOriginSet = new Set(allowedOrigins.map((origin) => origin.replace(/\/+$/, "")));

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header: curl, health checks, server-to-server calls.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOriginSet.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"));
    },
  })
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);

app.use((error, _req, res, _next) => {
  if (error?.message === "CORS origin not allowed") {
    return res.status(403).json({ message: "CORS origin not allowed." });
  }

  // Malformed JSON body etc.
  if (error?.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid request body." });
  }

  console.error("Server error:", error);
  return res.status(500).json({ message: "Internal server error." });
});

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
