import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";

const channelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Channel name is required"],
      trim: true,
      minlength: [3, "Channel name must be at least 3 characters"],
      maxlength: [50, "Channel name cannot exceed 50 characters"],
    },

    icon: {
      type: String,
      default: "/default-channel.png",
    },

    // 🔥 Cloudinary public ID for cleanup
    iconPublicId: {
      type: String,
      default: null,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    subscribers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ================== INDEXES ================== */
channelSchema.index({ name: "text" });
channelSchema.index({ subscribers: 1 });

/* ================== VIRTUALS ================== */
// Returns total number of subscribers
channelSchema.virtual("subscriberCount").get(function () {
  return this.subscribers?.length || 0;
});

/* ================== MIDDLEWARE ================== */
/**
 * ❗ IMPORTANT:
 * pre("remove") does NOT trigger on findOneAndDelete or findByIdAndDelete.
 * So we use post middleware for safe cleanup.
 */

// 🔥 Cleanup after channel deletion via findOneAndDelete / findByIdAndDelete
channelSchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;

  const Video = mongoose.model("Video");

  try {
    // Delete all videos belonging to this channel
    await Video.deleteMany({ channel: doc._id });

    // Delete channel icon from Cloudinary
    if (doc.iconPublicId) {
      await cloudinary.uploader.destroy(doc.iconPublicId);
    }
  } catch (err) {
    console.error("Channel cleanup failed:", err.message);
  }
});

// 🔥 Cleanup after channel.remove()
channelSchema.post("remove", async function (doc) {
  const Video = mongoose.model("Video");

  try {
    await Video.deleteMany({ channel: doc._id });

    if (doc.iconPublicId) {
      await cloudinary.uploader.destroy(doc.iconPublicId);
    }
  } catch (err) {
    console.error("Channel remove cleanup failed:", err.message);
  }
});

// ⚠️ LEGACY INDEX CLEANUP
// If an 'email' index exists from previous schemas, it causes "Email already registered" errors
// because we don't set email (so it's null), and unique index allows only one null.
const Channel = mongoose.model("Channel", channelSchema);

Channel.syncIndexes().catch(err => {
    console.log("Index sync error (safe to ignore if just dropping):", err.message);
});

// Explicitly try to drop the email index if it exists
Channel.collection.dropIndex("email_1").catch(() => {
    // Ignore error if index doesn't exist
});

export default Channel;
