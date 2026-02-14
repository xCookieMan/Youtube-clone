import Channel from "../models/Channel.js";
import User from "../models/User.js";
import Video from "../models/Video.js";
import cloudinary from "../config/cloudinary.js";
import { uploadImage } from "../utils/cloudinaryUpload.js";

/* ================= CREATE CHANNEL ================= */
export const createChannel = async (req, res, next) => {
  let channel = null;
  let iconPublicId = null;

  try {
    const { name } = req.body;
    const userId = req.user._id;

    // 1. Validation: Ensure name is provided and valid
    if (!name || name.trim().length < 3 || name.trim().length > 50) {
      return res.status(400).json({ 
        message: "Channel name must be between 3 and 50 characters" 
      });
    }

    // 2. Strict Check: Ensure User doesn't already have a channel
    // This enforces the "One Channel Per User" rule
    const existingChannel = await Channel.exists({ owner: userId });
    if (existingChannel) {
      return res.status(409).json({ message: "You already have a channel" });
    }

    // 3. Icon Logic:
    // - Priority 1: Uploaded file
    // - Priority 2: User's existing avatar (if available)
    // - Priority 3: Default channel icon
    let icon = "/default-channel.png";
    
    // Fetch user to get current avatar if needed
    const user = await User.findById(userId);
    if (user && user.avatar && user.avatar !== "/default-avatar.png") {
        icon = user.avatar;
    }

    // If file is uploaded, overwrite with new upload
    if (req.file) {
      try {
        const uploaded = await uploadImage(req.file.buffer, "youtube/channels");
        icon = uploaded.url;
        iconPublicId = uploaded.publicId;
      } catch (uploadErr) {
        console.error("[CreateChannel] Icon upload failed:", uploadErr);
        return res.status(500).json({ message: "Failed to upload channel icon" });
      }
    }

    // 4. Create the Channel (Distinct Logic)
    channel = await Channel.create({
      name: name.trim(),
      owner: userId,
      icon,
      iconPublicId,
      subscribers: [],
    });

    // 5. Return fully populated channel
    const populatedChannel = await Channel.findById(channel._id)
      .populate("owner", "name avatar role");

    res.status(201).json(populatedChannel);

  } catch (error) {
    // Rollback if creation fails (e.g. database error)
    if (channel) {
      await Channel.findByIdAndDelete(channel._id).catch(console.error);
    }
    if (iconPublicId) {
      await cloudinary.uploader.destroy(iconPublicId).catch(console.error);
    }
    
    next(error);
  }
};

/* ================= GET OWN CHANNEL ================= */
export const getUserChannel = async (req, res, next) => {
  try {
    const channel = await Channel.findOne({ owner: req.user._id }).populate(
      "owner",
      "name avatar role"
    );
    res.json(channel || null);
  } catch (err) {
    next(err);
  }
};

/* ================= GET CHANNEL BY ID ================= */
export const getChannelById = async (req, res, next) => {
  try {
    const channel = await Channel.findById(req.params.id)
      .populate("owner", "name avatar role")
      .lean();

    if (!channel) return res.status(404).json({ message: "Channel not found" });

    const [videos, shorts] = await Promise.all([
      Video.countDocuments({
        channel: channel._id,
        isShort: false,
        isDeleted: false,
      }),
      Video.countDocuments({
        channel: channel._id,
        isShort: true,
        isDeleted: false,
      }),
    ]);

    res.json({
      ...channel,
      stats: { videos, shorts },
      subscribers: channel.subscribers || [],
    });
  } catch (err) {
    next(err);
  }
};

/* ================= UPDATE CHANNEL NAME ================= */
export const updateChannelName = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name?.trim())
      return res.status(400).json({ message: "Channel name required" });

    const channel = await Channel.findOneAndUpdate(
      { owner: req.user._id },
      { name: name.trim() },
      { new: true }
    ).populate("owner", "name avatar role");

    if (channel) {
      await User.findByIdAndUpdate(
        req.user._id,
        { $set: { name: name.trim() } },
        { new: true }
      );
    }

    if (!channel) return res.status(404).json({ message: "Channel not found" });

    res.json(channel);
  } catch (err) {
    next(err);
  }
};

/* ================= UPDATE CHANNEL ICON ================= */
export const updateChannelIcon = async (req, res, next) => {
  try {
    if (!req.file?.buffer)
      return res.status(400).json({ message: "Icon file required" });

    const channel = await Channel.findOne({ owner: req.user._id });
    if (!channel) return res.status(404).json({ message: "Channel not found" });

    if (channel.iconPublicId) {
      await cloudinary.uploader.destroy(channel.iconPublicId).catch(() => {});
    }

    const uploaded = await uploadImage(req.file.buffer, "youtube/channels");
    channel.icon = uploaded.url;
    channel.iconPublicId = uploaded.publicId;
    await channel.save();

    // Sync User Avatar
    await User.findByIdAndUpdate(req.user._id, { avatar: channel.icon });

    const populated = await Channel.findById(channel._id).populate(
      "owner",
      "name avatar"
    );

    res.json(populated);
  } catch (err) {
    next(err);
  }
};

/* ================= DELETE CHANNEL (OWNER) ================= */
export const deleteChannel = async (req, res, next) => {
  try {
    const channel = await Channel.findOneAndDelete({ owner: req.user._id });
    if (!channel) return res.status(404).json({ message: "Channel not found" });

    await Video.deleteMany({ channel: channel._id });

    if (channel.iconPublicId) {
      await cloudinary.uploader.destroy(channel.iconPublicId).catch(() => {});
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/* ================= SUBSCRIBE / UNSUBSCRIBE ================= */
export const toggleSubscription = async (req, res, next) => {
  try {
    const channelId = req.params.id;
    const userId = req.user._id;

    if (!channelId) return res.status(400).json({ message: "Channel ID required" });

    // 1. Verify Channel Exists
    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ message: "Channel not found" });

    if (channel.owner?.toString() === userId.toString()) {
      return res.status(400).json({ message: "Cannot subscribe to own channel" });
    }

    // 2. Check Subscription Status
    const user = await User.findById(userId);
    const isSubscribed = user.subscriptions?.includes(channelId);

    // 3. Atomic Updates
    if (isSubscribed) {
      // Unsubscribe
      await Promise.all([
        User.findByIdAndUpdate(userId, { $pull: { subscriptions: channelId } }),
        Channel.findByIdAndUpdate(channelId, { $pull: { subscribers: userId } }),
      ]);
    } else {
      // Subscribe
      await Promise.all([
        User.findByIdAndUpdate(userId, { $addToSet: { subscriptions: channelId } }),
        Channel.findByIdAndUpdate(channelId, { $addToSet: { subscribers: userId } }),
      ]);
    }

    // 4. Return Updated State
    // We fetch fresh data to be sure, or just calculate
    const updatedChannel = await Channel.findById(channelId);
    const updatedUser = await User.findById(userId);

    res.json({
      subscribed: !isSubscribed,
      subscribers: updatedChannel.subscribers.length,
      userSubscriptions: updatedUser.subscriptions,
    });
  } catch (err) {
    next(err);
  }
};

/* ================= GET CHANNEL SUBSCRIBERS ================= */
export const getChannelSubscribers = async (req, res, next) => {
  try {
    const channel = await Channel.findById(req.params.id).populate(
      "subscribers",
      "name avatar"
    );
    if (!channel) return res.status(404).json({ message: "Channel not found" });

    // Filter nulls (e.g. deleted users)
    const subscribers = (channel.subscribers || []).filter(Boolean);
    res.json(subscribers);
  } catch (err) {
    next(err);
  }
};

/* ================= GET ALL CHANNELS ================= */
export const getAllChannels = async (req, res, next) => {
  try {
    const channels = await Channel.find()
      .populate("owner", "name avatar role")
      .select("name icon owner subscribers");

    res.json(channels);
  } catch (err) {
    next(err);
  }
};

/* ================= USER SUBSCRIPTIONS ================= */
export const getUserSubscriptions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "subscriptions",
      populate: { path: "owner", select: "name avatar" },
    });

    // Filter nulls (e.g. deleted channels)
    const subscriptions = (user?.subscriptions || []).filter(Boolean);
    res.json(subscriptions);
  } catch (err) {
    next(err);
  }
};

/* ================= DELETE CHANNEL (ADMIN) ================= */
export const deleteChannelAsAdmin = async (req, res, next) => {
  try {
    const channel = await Channel.findByIdAndDelete(req.params.id);
    if (!channel) return res.status(404).json({ message: "Channel not found" });

    // 1. Delete Videos
    await Video.deleteMany({ channel: channel._id });

    // 2. Remove Cloudinary Icon
    if (channel.iconPublicId) {
      await cloudinary.uploader.destroy(channel.iconPublicId).catch(() => {});
    }

    // 3. Remove Channel from User Subscriptions (Cleanup)
    await User.updateMany(
      { subscriptions: channel._id },
      { $pull: { subscriptions: channel._id } }
    );

    res.json({ success: true, message: "Channel deleted by admin" });
  } catch (err) {
    next(err);
  }
};
