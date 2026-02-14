import mongoose from "mongoose";

mongoose.set("strictQuery", true);

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  const isProd = process.env.NODE_ENV === "production";

  if (!uri) {
    console.error("❌ MONGO_URI is not defined in environment variables.");
    if (isProd) {
      process.exit(1);
    } else {
      console.warn("⚠️ Skipping MongoDB connection in development (no MONGO_URI)");
      return;
    }
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("🟢 MongoDB connected successfully");
  } catch (err) {
    console.error("🔴 MongoDB connection failed:", err.message);
    if (isProd) {
      process.exit(1);
    } else {
      console.warn("⚠️ Continuing without DB in development");
    }
  }
};

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
