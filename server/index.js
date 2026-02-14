import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

// ------------------ Routes ------------------
import authRoutes from "./routes/auth.routes.js";
import videoRoutes from "./routes/video.routes.js";
import channelRoutes from "./routes/channel.routes.js";
import userRoutes from "./routes/user.routes.js";
import playlistRoutes from "./routes/playlist.routes.js";

// ------------------ Load Environment ------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET not defined in environment variables");
  process.exit(1);
}

// ------------------ DB ------------------
connectDB();

// ------------------ App ------------------
const app = express();
const PORT = process.env.PORT || 5000;

// Force restart
console.log("Server restarting...");

// ------------------ CORS ------------------
const FRONTEND_URL =
  process.env.FRONTEND_URL?.trim() || "http://localhost:5173";

const CORS_ORIGINS =
  process.env.NODE_ENV === "production"
    ? [FRONTEND_URL]
    : ["http://localhost:5173", "http://localhost:3000", FRONTEND_URL];

app.use(
  cors({
    origin: CORS_ORIGINS,
    credentials: true,
  })
);

// ------------------ Security ------------------
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: [
          "'self'",
          "data:",
          "https://res.cloudinary.com",
          "https://cloudinary.com",
          "https://ui-avatars.com",
          "https://placehold.co",
        ],
        scriptSrc: ["'self'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: [
          "'self'",
          "https://res.cloudinary.com",
          "https://api.cloudinary.com",
          ...(process.env.NODE_ENV === "development"
            ? ["http://localhost:5000"]
            : []),
          FRONTEND_URL,
        ],
        mediaSrc: ["'self'", "https://res.cloudinary.com"],
        objectSrc: ["'none'"],
      },
    },
  })
);

// ------------------ Logging ------------------
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ------------------ Body Parsers ------------------
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ------------------ API Routes ------------------
app.use("/api/auth", authRoutes);
app.use("/api/channels", channelRoutes); // before videos (avoid :id clash)
app.use("/api/videos", videoRoutes); // ✅ history, watch later, liked inside
app.use("/api/users", userRoutes);
app.use("/api/playlists", playlistRoutes);

// ------------------ Health Check ------------------
app.get("/", (req, res) => {
  res.status(200).json({
    message: "YouTube Clone Backend Running ✅",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ------------------ Global Error Handler ------------------
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", err.stack || err);

  if (res.headersSent) return next(err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation Error",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = field === "email" 
      ? "Email is already registered" 
      : field === "owner" 
        ? "You already have a channel" 
        : `Duplicate value for ${field}`;

    return res.status(409).json({ message });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid token" });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Token expired" });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File too large (max 50MB)" });
  }

  res.status(500).json({
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { error: err.message }),
  });
});

// ------------------ Process Error Safety ------------------
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection 💥:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception 💥:", err);
  process.exit(1);
});

// ------------------ Production Static ------------------
if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(clientDist, "index.html"));
  });
}

// ------------------ Start Server ------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🟢 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🔐 JWT Secret: ${process.env.JWT_SECRET ? "Configured" : "MISSING!"}`
  );
});
