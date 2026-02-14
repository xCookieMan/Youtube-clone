import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import LoadingSkeleton from "../ui/LoadingSkeleton";

export default function ShortsCard({ short }) {
  const navigate = useNavigate();

  // Skeleton loader when data is not available
  if (!short) {
    return (
      <div className="shorts-card" role="article">
        <div className="shorts-thumbnail-wrapper">
          <LoadingSkeleton width="100%" height="200px" borderRadius="8px" />
          <div className="shorts-overlay">
            <div className="shorts-channel-avatar skeleton"></div>
            <div className="shorts-stats skeleton"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleClick = () => navigate(`/short/${short._id}`);

  // Convert likes count into readable format
  const formatViews = (count) => {
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
    return count.toString();
  };

  const likesCount = short.likes?.length || 0;
  const channelAvatar =
    short.channel?.icon ||
    short.owner?.avatar ||
    "https://ui-avatars.com/api/?name=User&background=random";
  const channelName = short.channel?.name || short.owner?.name || "Anonymous";
  const placeholderThumbnail = "https://placehold.co/120x200?text=Short";

  return (
    <motion.div
      className="shorts-card"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (["Enter", " "].includes(e.key)) handleClick();
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ duration: 0.2 }}
      style={{ cursor: "pointer" }}
    >
      <div
        className="shorts-thumbnail-wrapper"
        style={{
          position: "relative",
          width: "100%",
          paddingBottom: "166.66%", // 3:5 aspect ratio
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <motion.img
          src={short.thumbnail || placeholderThumbnail}
          alt={short.title || "Short video"}
          className="shorts-thumbnail"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          loading="lazy"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.3 }}
          onError={(e) => (e.target.src = placeholderThumbnail)}
        />

        {/* Overlay: channel avatar + stats (Bottom aligned) */}
        <div
          className="shorts-card-overlay"
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            width: "100%",
            padding: "12px",
            background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <img
              src={channelAvatar}
              alt={`${channelName}'s avatar`}
              className="shorts-card-avatar"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.5)",
                objectFit: "cover",
              }}
              onError={(e) =>
                (e.target.src =
                  "https://ui-avatars.com/api/?name=User&background=random")
              }
              loading="lazy"
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "bold",
                  textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                }}
              >
                {channelName}
              </span>
              <span
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "11px",
                  textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                }}
              >
                {formatViews(short.views || 0)} views
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>

  );
}
