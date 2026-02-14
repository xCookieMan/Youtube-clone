import { Router } from "express";
import * as channelCtrl from "../controllers/channel.controller.js";
import protect from "../middleware/protect.js";
import admin from "../middleware/admin.js";
import { uploadSingleImage } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

/* ================= USER CHANNEL MANAGEMENT ================= */

/**
 * @route   POST /api/channels
 * @desc    Create a new channel (with optional icon)
 * @access  Private
 */
router.post(
  "/",
  protect,
  uploadSingleImage("icon"),
  asyncHandler(channelCtrl.createChannel)
);

/**
 * @route   GET /api/channels
 * @desc    Get the current user's channel
 * @access  Private
 */
router.get("/", protect, asyncHandler(channelCtrl.getUserChannel));

/**
 * @route   DELETE /api/channels
 * @desc    Delete the current user's channel
 * @access  Private
 */
router.delete("/", protect, asyncHandler(channelCtrl.deleteChannel));

/**
 * @route   PATCH /api/channels/name
 * @desc    Update channel name
 * @access  Private
 */
router.patch("/name", protect, asyncHandler(channelCtrl.updateChannelName));

/**
 * @route   PATCH /api/channels/icon
 * @desc    Update channel icon
 * @access  Private
 */
router.patch(
  "/icon",
  protect,
  uploadSingleImage("icon"),
  asyncHandler(channelCtrl.updateChannelIcon)
);

/* ================= DISCOVERY ================= */

/**
 * @route   GET /api/channels/all
 * @desc    Get all channels (for discovery)
 * @access  Private
 */
router.get("/all", protect, asyncHandler(channelCtrl.getAllChannels));

/**
 * @route   GET /api/channels/subscriptions
 * @desc    Get channels current user is subscribed to
 * @access  Private
 */
router.get("/subscriptions", protect, channelCtrl.getUserSubscriptions);

/* ================= PUBLIC CHANNEL ================= */

/**
 * @route   GET /api/channels/:id
 * @desc    Get channel by ID (public)
 * @access  Public
 */
router.get("/:id", asyncHandler(channelCtrl.getChannelById));

/**
 * @route   POST /api/channels/:id/subscribe
 * @desc    Subscribe / Unsubscribe to a channel
 * @access  Private
 */
router.post(
  "/:id/subscribe",
  protect,
  asyncHandler(channelCtrl.toggleSubscription)
);

/**
 * @route   GET /api/channels/:id/subscribers
 * @desc    Get all subscribers of a channel
 * @access  Private
 */
router.get(
  "/:id/subscribers",
  protect,
  asyncHandler(channelCtrl.getChannelSubscribers)
);

/* ================= ADMIN ================= */

/**
 * @route   DELETE /api/channels/admin/:id
 * @desc    Delete any channel as admin
 * @access  Private/Admin
 */
router.delete(
  "/admin/:id",
  protect,
  admin,
  asyncHandler(channelCtrl.deleteChannelAsAdmin)
);

export default router;
