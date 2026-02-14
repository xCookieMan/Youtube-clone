import mongoose from "mongoose";

// Enable strict query mode to avoid deprecation warnings
mongoose.set("strictQuery", true);

/**
 * Connects to MongoDB using the MONGO_URI from environment variables.
 * Exits the process on connection failure in production.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("❌ MONGO_URI is not defined in environment variables.");
    process.exit(1);
  }

  try {
    // ✅ Mongoose v7+ no longer supports useNewUrlParser / useUnifiedTopology
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // 5-second timeout
    });
    console.log("🟢 MongoDB connected successfully");
  } catch (err) {
    console.error("🔴 MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

/* ================= CONNECTION EVENTS ================= */
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("🔄 MongoDB reconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err);
});

export default connectDB;
