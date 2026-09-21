const mongoose = require("mongoose");

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error(
      "MONGO_URI is not configured. Create server/.env (copy .env.example) and set MONGO_URI, or set it in your host's environment variables."
    );
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
  } catch (error) {
    // error.message can echo host names but not the password; never log the URI itself.
    throw new Error(`MongoDB connection failed: ${error.message}`);
  }

  console.log("MongoDB Connected");
};

module.exports = connectDB;
