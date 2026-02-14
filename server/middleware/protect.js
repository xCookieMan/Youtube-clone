import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * 🔐 Protect Middleware
 * Verifies JWT, checks user existence, deletion, and email verification.
 */
const protect = async (req, res, next) => {
  try {
    // ================= GET TOKEN =================
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // ================= VERIFY JWT SECRET =================
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("❌ JWT_SECRET not configured");
      return res.status(500).json({ message: "Server misconfiguration" });
    }

    // ================= VERIFY TOKEN =================
    const decoded = jwt.verify(token, secret);

    // ================= FIND USER =================
    const user = await User.findById(decoded.id).select("-password");

    if (!user || user.isDeleted) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    // ================= EMAIL VERIFIED CHECK =================
    if (!user.isEmailVerified) {
      return res.status(401).json({
        message: "Please verify your email first",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    // ================= ATTACH USER =================
    req.user = user;
    next();
  } catch (error) {
    // ================= JWT ERRORS =================
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    console.error("❌ Protect middleware error:", error.message);
    return res.status(500).json({
      message:
        process.env.NODE_ENV === "production"
          ? "Authentication failed"
          : error.message,
    });
  }
};

export default protect;
