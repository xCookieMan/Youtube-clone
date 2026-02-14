import User from "../models/User.js";
import Channel from "../models/Channel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { sendEmail } from "../utils/sendEmail.js";
import { generateOTP } from "../utils/generateOTP.js";
import {
  storeOTP,
  verifyOTP as verifyOTPService,
  getOTPData,
} from "../utils/otpService.js";

const getErrorMessage = (error) =>
  process.env.NODE_ENV === "production" ? "Request failed" : error.message;

/* ================== SEND OTP (REGISTER STEP 1) ================== */
export const sendOTP = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    // Support resend OTP (where only email is provided)
    if (!name && !password && email) {
      const existingData = getOTPData(email);
      if (existingData && existingData.userData) {
        name = existingData.userData.name;
        password = existingData.userData.password;
      } else {
        return res.status(400).json({ message: "Session expired. Please register again." });
      }
    }

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        message: "Email already registered. Please login to create a channel." 
      });
    }

    const otp = generateOTP(); // 6-digit string
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP with user data temporarily
    await storeOTP(email, otp, expiresAt, { name, email, password });

    await sendEmail({
      to: email,
      subject: "Verify your email",
      text: `Your OTP is ${otp}. It expires in 10 minutes.`,
    });

    return res.status(200).json({
      message: "OTP sent successfully",
      ...(process.env.NODE_ENV !== "production" && { otp }),
    });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ message: getErrorMessage(error) });
  }
};

/* ================== VERIFY OTP (REGISTER STEP 2) ================== */
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP required" });
    }

    const result = await verifyOTPService(email, otp);

    if (!result.isValid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const { name, password } = result.userData;

    const user = await User.create({
      name,
      email,
      password, // Pre-save hook will hash this
      isEmailVerified: true,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(201).json({
      user: { 
        _id: user._id, 
        name: user.name, 
        email: user.email,
        channelId: null 
      },
      token,
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: getErrorMessage(error) });
  }
};

/* ================== LOGIN ================== */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    if (!user.isEmailVerified) {
      return res.status(403).json({
        code: "EMAIL_NOT_VERIFIED",
        message: "Email not verified",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Check if user has a channel
    const channel = await Channel.findOne({ owner: user._id });

    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        subscriptions: user.subscriptions || [],
        channelId: channel ? channel._id : null,
      },
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: getErrorMessage(error) });
  }
};

/* ================== GET CURRENT USER ================== */
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const channel = await Channel.findOne({ owner: user._id });
    
    res.status(200).json({
      ...user.toObject(),
      channelId: channel ? channel._id : null
    });
  } catch (error) {
    console.error("Get Current User Error:", error);
    res.status(500).json({ message: getErrorMessage(error) });
  }
};

/* ================== FORGOT PASSWORD ================== */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    await storeOTP(email, otp, expiresAt, { email });

    await sendEmail({
      to: email,
      subject: "Reset your password",
      text: `Your password reset code is ${otp}. It expires in 10 minutes.`,
    });

    return res.status(200).json({
      message: "Reset code sent successfully",
      ...(process.env.NODE_ENV !== "production" && { otp }),
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: getErrorMessage(error) });
  }
};

/* ================== RESET PASSWORD ================== */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const verification = await verifyOTPService(email, otp);

    if (!verification.isValid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Assign plain password - User model pre-save hook will hash it
    user.password = newPassword;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: getErrorMessage(error) });
  }
};
