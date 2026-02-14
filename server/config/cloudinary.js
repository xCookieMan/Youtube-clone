import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

/* ================= LOAD ENV ================= */
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

/* ================= ENV VALIDATION ================= */
const REQUIRED_ENV = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const missing = REQUIRED_ENV.filter((key) => !process.env[key]);

if (missing.length) {
  throw new Error(
    `❌ Missing Cloudinary environment variables: ${missing.join(", ")}`
  );
}

/* ================= CONFIG ================= */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // always use HTTPS
});

/* ================= HEALTH CHECK ================= */
export const cloudinaryHealthCheck = async () => {
  try {
    // ping is lightweight and can be used to test connectivity
    await cloudinary.api.ping();
    console.log("✅ Cloudinary is reachable");
    return true;
  } catch (err) {
    console.error("❌ Cloudinary ping failed:", err.message);
    return false;
  }
};

/* ================= EXPORT ================= */
export default cloudinary;
