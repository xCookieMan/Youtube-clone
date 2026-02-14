import User from "../models/User.js";
import Channel from "../models/Channel.js";
import Video from "../models/Video.js";
import bcrypt from "bcryptjs";
import cloudinary from "../config/cloudinary.js";

/* ================= UPDATE PROFILE ================= */
export const updateProfile = async (req, res, next) => {
  try {
    const updates = {};

    if (req.body.name?.trim()) updates.name = req.body.name.trim();

    if (req.file?.buffer) {
      const user = await User.findById(req.user._id);

      // Delete old avatar if it exists and is not the default
      if (user.avatarPublicId) {
        await cloudinary.uploader.destroy(user.avatarPublicId).catch(() => {});
      }

      // Upload new avatar
      const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "youtube/avatars" },
          (err, result) => (err ? reject(err) : resolve(result))
        );
        stream.end(req.file.buffer);
      });

      updates.avatar = uploaded.secure_url;
      updates.avatarPublicId = uploaded.public_id;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    ).select("-password");

    // Sync Channel if name or avatar changed
    if (updates.name || updates.avatar) {
      const channelUpdates = {};
      if (updates.name) channelUpdates.name = updates.name;
      if (updates.avatar) channelUpdates.icon = updates.avatar;

      await Channel.findOneAndUpdate(
        { owner: req.user._id },
        { $set: channelUpdates }
      );
    }

    res.json(updatedUser);
  } catch (err) {
    next(err);
  }
};

/* ================= GET CURRENT USER ================= */
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

/* ================= LOGOUT ================= */
export const logout = (req, res) => {
  res.json({ success: true, message: "Logged out" });
};

/* ================= USER CONTENT ================= */
export const getUserContent = async (req, res, next) => {
  try {
    const populateChannel = {
      path: "channel",
      select: "name icon owner",
      populate: { path: "owner", select: "name avatar role" },
    };

    const [videos, shorts] = await Promise.all([
      Video.find({
        owner: req.user._id,
        isShort: false,
        isDeleted: false,
      }).populate(populateChannel),
      Video.find({
        owner: req.user._id,
        isShort: true,
        isDeleted: false,
      }).populate(populateChannel),
    ]);

    res.json({ videos, shorts });
  } catch (err) {
    next(err);
  }
};

/* ================= CHANGE PASSWORD (SELF) ================= */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new password are required" });
    }

    if (String(newPassword).trim().length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Set new password (plain text) - Model pre-save hook will hash it
    user.password = String(newPassword);
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
};

/* ================= DELETE CURRENT USER (SELF) ================= */
export const deleteCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 1. Delete Channel & Videos
    const channel = await Channel.findOneAndDelete({ owner: userId });
    if (channel) {
      await Video.deleteMany({ channel: channel._id });
      if (channel.iconPublicId) {
        await cloudinary.uploader.destroy(channel.iconPublicId).catch(() => {});
      }
    }

    // 2. Remove User from Subscribers lists (Atomic)
    await Channel.updateMany(
      { subscribers: userId },
      { $pull: { subscribers: userId } }
    );

    // 3. Delete User
    await User.findByIdAndDelete(userId);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/* ================= DELETE USER (ADMIN) ================= */
export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Delete Channel & Videos
    const channel = await Channel.findOneAndDelete({ owner: userId });
    if (channel) {
      await Video.deleteMany({ channel: channel._id });
      if (channel.iconPublicId) {
        await cloudinary.uploader.destroy(channel.iconPublicId).catch(() => {});
      }
    }

    // 2. Remove User from Subscribers lists (Atomic)
    await Channel.updateMany(
      { subscribers: userId },
      { $pull: { subscribers: userId } }
    );

    // 3. Delete User
    await User.findByIdAndDelete(userId);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
