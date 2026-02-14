import { Router } from "express";
import {
  sendOTP,
  verifyOTP,
  login,
  getCurrentUser,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import protect from "../middleware/protect.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

/* ================= AUTH ROUTES ================= */

/**
 * @route   POST /api/auth/send-otp
 * @desc    Step 1: Send OTP for registration
 * @access  Public
 */
router.post("/send-otp", asyncHandler(sendOTP));

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Step 2: Verify OTP and register user
 * @access  Public
 */
router.post("/verify-otp", asyncHandler(verifyOTP));

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send OTP for password reset
 * @access  Public
 */
router.post("/forgot-password", asyncHandler(forgotPassword));

/**
 * @route   POST /api/auth/reset-password
 * @desc    Verify OTP and reset password
 * @access  Public
 */
router.post("/reset-password", asyncHandler(resetPassword));

/**
 * @route   POST /api/auth/login
 * @desc    Login a verified user
 * @access  Public
 */
router.post("/login", asyncHandler(login));

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user info
 * @access  Private
 */
router.get("/me", protect, asyncHandler(getCurrentUser));

export default router;
