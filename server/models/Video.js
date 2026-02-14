import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [5000, "Description is too long"],
    },

    category: {
      type: String,
      enum: [
        "General",
        "Music",
        "Gaming",
        "Sports",
        "News",
        "Movies",
        "Education",
        "Tech",
        "Comedy",
      ],
      default: "General",
      index: true,
    },

    url: {
      type: String,
      required: true,
    },

    // 🔥 Cloudinary cleanup support
    publicId: {
      type: String,
      default: null,
    },

    thumbnail: {
      type: String,
      default: null,
    },

    thumbnailPublicId: {
      type: String,
      default: null,
    },

    duration: {
      type: Number,
      required: true,
      min: [0, "Duration cannot be negative"],
    },

    isShort: {
      type: Boolean,
      default: false,
      index: true,
    },

    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
      index: true,
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],

    dislikes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],

    comments: [
      {
        text: {
          type: String,
          required: true,
          trim: true,
          maxlength: [500, "Comment is too long"],
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        likes: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ],
        // New: Support nested replies
        replies: [
          {
            text: {
              type: String,
              required: true,
              trim: true,
              maxlength: [500, "Reply is too long"],
            },
            user: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
              required: true,
            },
            likes: [
              {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
              },
            ],
            createdAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true },
  }
);

/* ================== INDEXES ================== */
videoSchema.index({ createdAt: -1 });
videoSchema.index({ title: "text", description: "text" });

/* ================== VIRTUALS ================== */
videoSchema.virtual("likeCount").get(function () {
  return this.likes?.length || 0;
});

videoSchema.virtual("commentCount").get(function () {
  return this.comments?.length || 0;
});

/* ================== QUERY FILTER (SOFT DELETE) ================== */
videoSchema.pre(/^find/, function () {
  if (!this.getOptions()?.includeDeleted) {
    this.where({ isDeleted: false });
  }
});

/* ================== CLOUDINARY CLEANUP ================== */
// ❗ pre("remove") does not run for findByIdAndDelete, use post hooks

videoSchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;

  try {
    if (doc.publicId) {
      await cloudinary.uploader.destroy(doc.publicId, {
        resource_type: "video",
      });
    }
    if (doc.thumbnailPublicId) {
      await cloudinary.uploader.destroy(doc.thumbnailPublicId);
    }
  } catch (err) {
    console.error("Video cleanup failed:", err.message);
  }
});

videoSchema.post("remove", async function (doc) {
  try {
    if (doc.publicId) {
      await cloudinary.uploader.destroy(doc.publicId, {
        resource_type: "video",
      });
    }
    if (doc.thumbnailPublicId) {
      await cloudinary.uploader.destroy(doc.thumbnailPublicId);
    }
  } catch (err) {
    console.error("Video remove cleanup failed:", err.message);
  }
});

export default mongoose.model("Video", videoSchema);
