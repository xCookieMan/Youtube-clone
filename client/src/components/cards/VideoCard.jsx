import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import LoadingSkeleton from "../ui/LoadingSkeleton";

export default function VideoCard({ video }) {
  const navigate = useNavigate();

  // Skeleton loader for loading state
  if (!video) {
    return (
      <div className="video-card" role="article">
        <LoadingSkeleton width="100%" height="180px" borderRadius="8px" />
        <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
          <LoadingSkeleton width="40px" height="40px" borderRadius="50%" />
          <div style={{ flex: 1 }}>
            <LoadingSkeleton width="100%" height="16px" />
            <LoadingSkeleton
              width="70%"
              height="14px"
              style={{ marginTop: "6px" }}
            />
            <LoadingSkeleton
              width="60%"
              height="12px"
              style={{ marginTop: "4px" }}
            />
          </div>
        </div>
      </div>
    );
  }

  const handleClick = () => navigate(`/watch/${video._id}`);

  // Format views into readable strings
  const formatViews = (count) => {
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
    return count.toString();
  };

  const viewsCount = video.views || video.likes?.length || 0;

  // Simple time ago helper
  const timeAgo = (date) => {
    if (!date) return "Unknown";
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return "Today";
    if (diffDays < 7) return `${diffDays}d`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo`;
    return `${Math.floor(diffDays / 365)}y`;
  };

  // Fallbacks
  const channelAvatar =
    video.channel?.icon ||
    video.owner?.avatar ||
    "https://ui-avatars.com/api/?name=User&background=random";
  const channelName = video.channel?.name || video.owner?.name || "Anonymous";
  const placeholderThumbnail = "https://placehold.co/300x180?text=No+Thumbnail";

  return (
    <motion.div
      className="video-card"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (["Enter", " "].includes(e.key)) handleClick();
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3 }}
      style={{ cursor: "pointer", width: "100%", maxWidth: "100%" }}
    >
      {/* Thumbnail */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingBottom: "56.25%", // 16:9 ratio
          borderRadius: "12px", // Increased radius for modern look
          overflow: "hidden",
          backgroundColor: "#000",
        }}
      >
        <motion.img
          src={video.thumbnail || placeholderThumbnail}
          alt={video.title || "Video thumbnail"}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          loading="lazy"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
          onError={(e) => (e.target.src = placeholderThumbnail)}
        />
      </div>

      {/* Video Info */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginTop: "12px",
          width: "100%",
        }}
      >
        <img
          src={channelAvatar}
          alt={`${channelName}'s avatar`}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
          }}
          loading="lazy"
          onError={(e) =>
            (e.target.src =
              "https://ui-avatars.com/api/?name=User&background=random")
          }
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title */}
          <div
            style={{
              fontWeight: "bold",
              fontSize: "14px",
              lineHeight: 1.3,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              color: "var(--text-primary)", // Use variable
            }}
          >
            {video.title || "Untitled video"}
          </div>

          {/* Channel Name */}
          <div style={{ color: "#606060", fontSize: "13px", marginTop: "4px" }}>
            {channelName}
          </div>

          {/* Views & Time */}
          <div style={{ color: "#909090", fontSize: "12px", marginTop: "2px" }}>
            {formatViews(viewsCount)} views • {timeAgo(video.createdAt)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
