import Video from "../models/Video.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import { getRecommendations } from "../utils/recommendationEngine.js";

const CATEGORY_VALUES = [
  "All",
  "Music",
  "Gaming",
  "Sports",
  "News",
  "Entertainment",
  "Education",
  "Science & Technology",
  "Travel",
  "Comedy",
  "How-to & Style",
  "Film & Animation",
  "Pets & Animals",
  "Autos & Vehicles",
];

/* ================== UPLOAD VIDEO ================== */
export const uploadVideo = async (req, res, next) => {
  try {
    const { title, description, category, duration } = req.body;
    const userId = req.user._id;

    if (!req.files?.video?.[0]) {
      return res.status(400).json({ message: "Video file is required" });
    }

    const channel = await mongoose.model("Channel").findOne({ owner: userId });
    
    if (!channel) {
      return res.status(403).json({ message: "You must create a channel before uploading videos" });
    }

    const videoFile = req.files.video[0];
    const thumbnailFile = req.files.thumbnail?.[0];

    // Upload Video
    const videoUpload = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "video", folder: "youtube/videos" },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
      stream.end(videoFile.buffer);
    });

    const videoData = {
      url: videoUpload.secure_url,
      publicId: videoUpload.public_id,
    };

    // Upload Thumbnail (if provided)
    let thumbnailData = null;
    if (thumbnailFile) {
      const thumbUpload = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "image", folder: "youtube/thumbnails" },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
        stream.end(thumbnailFile.buffer);
      });
      thumbnailData = {
        url: thumbUpload.secure_url,
        publicId: thumbUpload.public_id,
      };
    }

    const durationNum = Number(duration) || 0;
    const isShort = durationNum > 0 && durationNum <= 60;

    const newVideo = await Video.create({
      title,
      description,
      category: category || "General",
      videoUrl: videoData.url, // Assuming model field name
      thumbnailUrl: thumbnailData?.url || "", // Assuming model field name
      publicId: videoData.publicId,
      thumbnailPublicId: thumbnailData?.publicId,
      duration: durationNum,
      isShort,
      channel: channel._id,
      owner: userId,
      views: 0,
      likes: [],
      dislikes: [],
      comments: [],
    });

    res.status(201).json(newVideo);
  } catch (err) {
    next(err);
  }
};

/* ================== GET VIDEOS ================== */
export const getVideos = async (req, res, next) => {
  try {
    const videos = await Video.find({ isShort: false, isDeleted: false })
      .populate("channel", "name icon owner")
      .populate({ path: "channel", populate: { path: "owner", select: "name avatar" } })
      .sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    next(err);
  }
};

/* ================== GET SHORTS ================== */
export const getShorts = async (req, res, next) => {
  try {
    const shorts = await Video.find({ isShort: true, isDeleted: false })
      .populate("channel", "name icon owner")
      .populate({ path: "channel", populate: { path: "owner", select: "name avatar" } })
      .sort({ createdAt: -1 });
    res.json(shorts);
  } catch (err) {
    next(err);
  }
};

/* ================== SEARCH VIDEOS ================== */
export const searchVideos = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const regex = new RegExp(q, "i");
    const videos = await Video.find({
      $or: [{ title: regex }, { description: regex }],
      isDeleted: false,
    })
      .populate("channel", "name icon owner")
      .populate({ path: "channel", populate: { path: "owner", select: "name avatar" } });
    
    res.json(videos);
  } catch (err) {
    next(err);
  }
};

/* ================== GET BY CATEGORY ================== */
export const getVideosByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const videos = await Video.find({ 
      category: new RegExp(`^${category}$`, 'i'),
      isShort: false, 
      isDeleted: false 
    })
      .populate("channel", "name icon owner")
      .populate({ path: "channel", populate: { path: "owner", select: "name avatar" } })
      .sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    next(err);
  }
};

/* ================== GET VIDEO BY ID ================== */
export const getVideoById = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate("channel", "name icon owner subscribers")
      .populate({ path: "channel", populate: { path: "owner", select: "name avatar" } })
      .populate("comments.user", "name avatar"); // Populate comments user

    if (!video || video.isDeleted) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Increment views
    video.views += 1;
    await video.save();

    // Fetch related videos (simple implementation: exclude current, same category preferred if we had it, otherwise just recent/popular)
    // For now, let's just fetch other videos excluding this one
    const relatedVideos = await Video.find({
      _id: { $ne: video._id },
      isShort: false,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(12)
      .populate("channel", "name icon owner")
      .populate({ path: "channel", populate: { path: "owner", select: "name avatar" } });

    // Fetch related shorts
    const relatedShorts = await Video.find({
      isShort: true,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("channel", "name icon owner")
      .populate({ path: "channel", populate: { path: "owner", select: "name avatar" } });

    // Get user's progress if authenticated
    let userProgress = 0;
    if (req.user) {
      const user = await User.findById(req.user._id);
      const historyEntry = user.watchHistory?.find(
        (h) => h.video?.toString() === video._id.toString()
      );
      if (historyEntry) {
        userProgress = historyEntry.progress || 0;
      }
    }

    const videoObj = video.toObject();
    videoObj.relatedVideos = relatedVideos;
    videoObj.relatedShorts = relatedShorts;
    videoObj.userProgress = userProgress;

    res.json(videoObj);
  } catch (err) {
    next(err);
  }
};

/* ================== LIKE / DISLIKE ================== */
export const likeVideo = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    if (video.likes.includes(userId)) {
      video.likes = video.likes.filter(id => id.toString() !== userId.toString());
    } else {
      video.likes.push(userId);
      video.dislikes = video.dislikes.filter(id => id.toString() !== userId.toString());
    }
    await video.save();
    res.json({ likes: video.likes, dislikes: video.dislikes });
  } catch (err) {
    next(err);
  }
};

export const dislikeVideo = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    if (video.dislikes.includes(userId)) {
      video.dislikes = video.dislikes.filter(id => id.toString() !== userId.toString());
    } else {
      video.dislikes.push(userId);
      video.likes = video.likes.filter(id => id.toString() !== userId.toString());
    }
    await video.save();
    res.json({ likes: video.likes, dislikes: video.dislikes });
  } catch (err) {
    next(err);
  }
};

/* ================== COMMENTS ================== */
export const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    const newComment = {
      user: req.user._id,
      text,
      createdAt: new Date(),
    };
    
    video.comments.unshift(newComment);
    await video.save();
    
    // Populate user to return
    await video.populate("comments.user", "name avatar");
    
    res.json(video.comments[0]);
  } catch (err) {
    next(err);
  }
};

export const replyToComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const { commentId } = req.params;
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    const comment = video.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const newReply = {
      user: req.user._id,
      text,
      createdAt: new Date(),
    };

    comment.replies.push(newReply);
    await video.save();

    // Need to populate the user in the reply
    // Since replies are subdocs, we might need to fetch user separately or repopulate
    const populatedVideo = await Video.findById(req.params.id).populate("comments.replies.user", "name avatar");
    const updatedComment = populatedVideo.comments.id(commentId);
    const addedReply = updatedComment.replies[updatedComment.replies.length - 1];

    res.json(addedReply);
  } catch (err) {
    next(err);
  }
};

export const likeComment = async (req, res, next) => {
  // Implementation for like comment if needed, but not critical for now
  res.json({ message: "Not implemented yet" });
};

/* ================== ADMIN ================== */
export const deleteVideoAsAdmin = async (req, res, next) => {
  try {
    await Video.findByIdAndDelete(req.params.id);
    res.json({ message: "Video deleted" });
  } catch (err) {
    next(err);
  }
};

/* ================== HISTORY ================== */
export const addToHistory = async (req, res, next) => {
  try {
    const { videoId, progress, duration } = req.body;
    const userId = req.user._id;

    if (!videoId) return res.status(400).json({ message: "Video ID required" });

    // Check if video is completed (e.g. > 95% watched)
    // If completed, remove from history
    if (progress && duration && progress / duration > 0.95) {
      await User.findByIdAndUpdate(userId, {
        $pull: { watchHistory: { video: videoId } }
      });
      return res.json({ success: true, removed: true });
    }

    // Remove existing entry to avoid duplicates
    await User.findByIdAndUpdate(userId, {
      $pull: { watchHistory: { video: videoId } }
    });

    // Add to top of history with progress
    await User.findByIdAndUpdate(userId, {
      $push: { 
        watchHistory: { 
          $each: [{ video: videoId, watchedAt: new Date(), progress: progress || 0 }],
          $position: 0,
          $slice: 100 
        } 
      }
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const getWatchHistory = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "watchHistory.video",
      populate: {
        path: "channel",
        select: "name icon owner",
        populate: { path: "owner", select: "name avatar" }
      }
    });
    
    // Deduplicate history
    const uniqueVideos = [];
    const seenIds = new Set();

    if (user.watchHistory && user.watchHistory.length > 0) {
      for (const item of user.watchHistory) {
        // Check if video exists (might be deleted) and hasn't been seen yet
        if (item.video && !seenIds.has(item.video._id.toString())) {
          seenIds.add(item.video._id.toString());
          uniqueVideos.push(item.video);
        }
      }
    }
      
    res.json(uniqueVideos);
  } catch (err) {
    next(err);
  }
};

/* ================== WATCH LATER ================== */
export const addToWatchLater = async (req, res, next) => {
  try {
    const { videoId } = req.body;
    if (!videoId) return res.status(400).json({ message: "Video ID required" });

    await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { watchLater: videoId } },
      { new: true }
    );

    res.json({ success: true, message: "Added to Watch Later" });
  } catch (err) {
    next(err);
  }
};

export const getWatchLaterIds = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("watchLater");
    const ids = (user?.watchLater || []).filter(Boolean);
    res.json(ids);
  } catch (err) {
    next(err);
  }
};

export const getWatchLater = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "watchLater",
      populate: {
        path: "channel",
        select: "name icon owner",
        populate: { path: "owner", select: "name avatar" }
      }
    });

    const videos = (user?.watchLater || []).filter(Boolean);
    res.json(videos);
  } catch (err) {
    next(err);
  }
};

export const removeFromWatchLater = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { watchLater: videoId } },
      { new: true }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/* ================== LIKED VIDEOS ================== */
export const getLikedVideos = async (req, res, next) => {
  try {
    const videos = await Video.find({
      likes: req.user._id,
      isDeleted: false,
    })
      .populate({
        path: "channel",
        select: "name icon owner",
        populate: { path: "owner", select: "name avatar" },
      })
      .sort({ createdAt: -1 });

    res.json(videos);
  } catch (err) {
    next(err);
  }
};

/* ================== SUBSCRIPTIONS ================== */
export const getSubscribedVideos = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const subs = (user.subscriptions || []).filter(Boolean);
    
    if (subs.length === 0) return res.json([]);

    const videos = await Video.find({
      channel: { $in: subs },
      isDeleted: false,
    })
    .populate({
      path: "channel",
      select: "name icon owner",
      populate: { path: "owner", select: "name avatar" }
    })
    .sort({ createdAt: -1 });
    
    res.json(videos);
  } catch (err) {
    next(err);
  }
};

/* ================== RECOMMENDATIONS ================== */
export const getRecommendedVideos = async (req, res, next) => {
  try {
    // Simplified recommendation logic
    const videos = await Video.find({ isShort: false, isDeleted: false })
      .sort({ views: -1 })
      .limit(20)
      .populate("channel", "name icon owner")
      .populate({ path: "channel", populate: { path: "owner", select: "name avatar" } });
      
    const shorts = await Video.find({ isShort: true, isDeleted: false })
      .sort({ views: -1 })
      .limit(10)
      .populate("channel", "name icon owner")
      .populate({ path: "channel", populate: { path: "owner", select: "name avatar" } });

    res.json({ videos, shorts });
  } catch (err) {
    next(err);
  }
};

/* ================== GET USER VIDEOS ================== */
export const getUserVideos = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const channel = await mongoose.model("Channel").findOne({ owner: userId });
    if (!channel) return res.json([]); 

    const videos = await Video.find({ 
      channel: channel._id, 
      isDeleted: false 
    })
    .sort({ createdAt: -1 })
    .populate("channel", "name icon owner")
    .populate("owner", "name avatar");

    res.json(videos);
  } catch (err) {
    next(err);
  }
};

/* ================== GET VIDEOS BY CHANNEL ================== */
export const getVideosByChannel = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const videos = await Video.find({ channel: channelId, isDeleted: false })
      .populate("channel", "name icon owner")
      .populate({ path: "channel", populate: { path: "owner", select: "name avatar" } })
      .sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    next(err);
  }
};
