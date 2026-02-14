import mongoose from "mongoose";

const PlaylistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Playlist name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    videos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    isPrivate: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Playlist", PlaylistSchema);
