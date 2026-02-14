import multer from "multer";

/* ================== FILE FILTER ================== */
const fileFilter = (req, file, cb) => {
  // 🎥 Video uploads
  if (file.fieldname === "video") {
    if (!file.mimetype.startsWith("video/")) {
      return cb(new Error("Only video files are allowed"), false);
    }
    return cb(null, true);
  }

  // 🖼️ Image uploads (thumbnail, avatar, icon)
  if (["thumbnail", "avatar", "icon"].includes(file.fieldname)) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    return cb(null, true);
  }

  // ❌ Unknown field
  cb(new Error("Invalid upload field"), false);
};

/* ================== STORAGE ================== */
const storage = multer.memoryStorage();

/* ================== SIZE LIMITS ================== */
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

/* ================== VIDEO + THUMBNAIL ================== */
export const uploadVideo = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_SIZE },
  fileFilter,
}).fields([
  { name: "video", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]);

/* ================== SINGLE IMAGE ================== */
export const uploadSingleImage = (fieldName) =>
  multer({
    storage,
    limits: { fileSize: MAX_IMAGE_SIZE },
    fileFilter,
  }).single(fieldName);

/* ================== ERROR HANDLER ================== */
export const multerErrorHandler = (err, req, res, next) => {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File size exceeds limit" });
    }
    return res.status(400).json({ message: err.message });
  }

  // Generic errors
  return res.status(400).json({
    message: err.message || "File upload failed",
  });
};
