import { Router } from "express";
import * as videoCtrl from "../controllers/video.controller.js";
import protect from "../middleware/protect.js";
import admin from "../middleware/admin.js";
import { uploadVideo } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

/* ================= UPLOAD ================= */

/**
 * @route   POST /api/videos/upload
 * @desc    Upload a new video (with optional thumbnail)
 * @access  Private
 */
router.post(
  "/upload",
  protect,
  uploadVideo,
  asyncHandler(videoCtrl.uploadVideo)
);

/* ================= PUBLIC VIDEOS ================= */

/**
 * @route   GET /api/videos/
 * @desc    Get all videos (feed)
 * @access  Public
 */
router.get("/", asyncHandler(videoCtrl.getVideos));

/**
 * @route   GET /api/videos/shorts
 * @desc    Get all shorts
 * @access  Public
 */
router.get("/shorts", asyncHandler(videoCtrl.getShorts));

/**
 * @route   GET /api/videos/search
 * @desc    Search videos and channels by query
 * @access  Public
 */
router.get("/search", asyncHandler(videoCtrl.searchVideos));

/**
 * @route   GET /api/videos/category/:category
 * @desc    Get videos by category
 * @access  Public
 */
router.get("/category/:category", asyncHandler(videoCtrl.getVideosByCategory));

/* ================= USER CONTENT ================= */

/**
 * @route   GET /api/videos/me
 * @desc    Get videos uploaded by current user
 * @access  Private
 */
router.get("/me", protect, asyncHandler(videoCtrl.getUserVideos));

/**
 * @route   GET /api/videos/liked
 * @desc    Get videos liked by current user
 * @access  Private
 */
router.get("/liked", protect, asyncHandler(videoCtrl.getLikedVideos));

/**
 * @route   GET /api/videos/history
 * @desc    Get watch history
 * @access  Private
 */
router.get("/history", protect, asyncHandler(videoCtrl.getWatchHistory));

/**
 * @route   GET /api/videos/watch-later
 * @desc    Get watch later list
 * @access  Private
 */
router.get("/watch-later", protect, asyncHandler(videoCtrl.getWatchLater));

/**
 * @route   GET /api/videos/watch-later/ids
 * @desc    Get watch later IDs only
 * @access  Private
 */
router.get("/watch-later/ids", protect, asyncHandler(videoCtrl.getWatchLaterIds));


/**
 * @route   GET /api/videos/subscribed
 * @desc    Get videos from subscribed channels
 * @access  Private
 */
router.get(
  "/subscribed",
  protect,
  asyncHandler(videoCtrl.getSubscribedVideos)
);

/**
 * @route   GET /api/videos/recommended
 * @desc    Get personalized recommended videos and shorts
 * @access  Private
 */
router.get(
  "/recommended",
  protect,
  asyncHandler(videoCtrl.getRecommendedVideos)
);

/* ================= USER INTERACTIONS ================= */

/**
 * @route   POST /api/videos/:id/like
 * @desc    Like or unlike a video
 * @access  Private
 */
router.post("/:id/like", protect, asyncHandler(videoCtrl.likeVideo));

/**
 * @route   POST /api/videos/:id/dislike
 * @desc    Dislike or undislike a video
 * @access  Private
 */
router.post("/:id/dislike", protect, asyncHandler(videoCtrl.dislikeVideo));

/**
 * @route   POST /api/videos/:id/comment
 * @desc    Add a comment to a video
 * @access  Private
 */
router.post("/:id/comment", protect, asyncHandler(videoCtrl.addComment));

/**
 * @route   POST /api/videos/:id/comments/:commentId/reply
 * @desc    Reply to a comment
 * @access  Private
 */
router.post(
  "/:id/comments/:commentId/reply",
  protect,
  asyncHandler(videoCtrl.replyToComment)
);

/**
 * @route   POST /api/videos/:id/comments/:commentId/like
 * @desc    Like or unlike a comment
 * @access  Private
 */
router.post(
  "/:id/comments/:commentId/like",
  protect,
  asyncHandler(videoCtrl.likeComment)
);

/**
 * @route   POST /api/videos/history
 * @desc    Add video to watch history
 * @access  Private
 */
router.post("/history", protect, asyncHandler(videoCtrl.addToHistory));

/**
 * @route   POST /api/videos/watch-later
 * @desc    Add video to watch later
 * @access  Private
 */
router.post("/watch-later", protect, asyncHandler(videoCtrl.addToWatchLater));

/**
 * @route   DELETE /api/videos/watch-later/:videoId
 * @desc    Remove video from watch later
 * @access  Private
 */
router.delete(
  "/watch-later/:videoId",
  protect,
  asyncHandler(videoCtrl.removeFromWatchLater)
);

/* ================= ADMIN ================= */

/**
 * @route   DELETE /api/videos/admin/:id
 * @desc    Delete a video as admin
 * @access  Private/Admin
 */
router.delete(
  "/admin/:id",
  protect,
  admin,
  asyncHandler(videoCtrl.deleteVideoAsAdmin)
);

/* ================= SINGLE VIDEO ================= */

/**
 * @route   GET /api/videos/:id
 * @desc    Get single video by ID
 * @access  Public
 */
router.get("/:id", asyncHandler(videoCtrl.getVideoById));

/**
 * @route   GET /api/videos/channel/:channelId
 * @desc    Get videos by channel ID
 * @access  Public
 */
router.get("/channel/:channelId", asyncHandler(videoCtrl.getVideosByChannel));

export default router;
