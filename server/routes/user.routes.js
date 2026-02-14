import { Router } from "express";
import * as userCtrl from "../controllers/user.controller.js";
import protect from "../middleware/protect.js";
import admin from "../middleware/admin.js";
import { uploadSingleImage } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

/**
 * @route   GET /api/users/me
 * @desc    Get current logged-in user
 * @access  Private
 */
router.get("/me", protect, asyncHandler(userCtrl.getCurrentUser));

/**
 * @route   POST /api/users/logout
 * @desc    Logout user
 * @access  Private
 */
router.post("/logout", protect, asyncHandler(userCtrl.logout));

/* ================= PROFILE ================= */

/**
 * @route   PATCH /api/users/avatar
 * @desc    Update user avatar
 * @access  Private
 */
router.patch(
  "/avatar",
  protect,
  uploadSingleImage("avatar"),
  asyncHandler(userCtrl.updateProfile)
);

/**
 * @route   PATCH /api/users/profile
 * @desc    Update profile (name/avatar)
 * @access  Private
 */
router.patch(
  "/profile",
  protect,
  uploadSingleImage("avatar"),
  asyncHandler(userCtrl.updateProfile)
);

/**
 * @route   PATCH /api/users/password
 * @desc    Change password for current user
 * @access  Private
 */
router.patch("/password", protect, userCtrl.changePassword);

/**
 * @route   DELETE /api/users/me
 * @desc    Delete current user account
 * @access  Private
 */
router.delete("/me", protect, userCtrl.deleteCurrentUser);

/* ================= USER CONTENT ================= */

/**
 * @route   GET /api/users/content
 * @desc    Get videos and shorts uploaded by current user
 * @access  Private
 */
router.get("/content", protect, asyncHandler(userCtrl.getUserContent));

/* ================= ADMIN ================= */

/**
 * @route   DELETE /api/users/admin/:userId
 * @desc    Delete a user as admin
 * @access  Private/Admin
 */
router.delete(
  "/admin/users/:userId",
  protect,
  admin,
  asyncHandler(userCtrl.deleteUser)
);

export default router;
