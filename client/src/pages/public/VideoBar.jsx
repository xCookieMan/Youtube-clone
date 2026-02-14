import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";

export default function VideoBar({
  videos = [],
  shorts = [],
  loading = false,
}) {
  const navigate = useNavigate();
  const shortsRef = useRef(null);

  const scrollShorts = (direction) => {
    if (shortsRef.current) {
      const scrollAmount = direction === "left" ? -320 : 320;
      shortsRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const timeAgo = (date) => {
    if (!date) return "";
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return "Today";
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  };

  // ----------------- SKELETON LOADING -----------------
  if (loading) {
    return (
      <div className="video-bar">
        {/* Shorts skeleton */}
        <div className="video-bar-shorts">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="short-skeleton"></div>
          ))}
        </div>
        {/* Video skeleton */}
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <LoadingSkeleton
              height={120}
              style={{ borderRadius: 12, marginBottom: 6 }}
            />
            <LoadingSkeleton
              height={14}
              width="80%"
              style={{ marginBottom: 2 }}
            />
            <LoadingSkeleton height={12} width="60%" />
          </div>
        ))}
      </div>
    );
  }

  // ----------------- CARD RENDERER -----------------
  const renderCard = (item, isShort = false) => {
    const channelName = item.channel?.name || item.channelName || "Channel";
    const channelAvatar = item.channel?.icon || item.channel?.owner?.avatar || item.channelAvatar || "/default-avatar.png";

    // RENDER SHORT CARD
    if (isShort) {
      return (
        <div
          key={item._id}
          className="short-bar-card"
          onClick={() => navigate(`/short/${item._id}`)}
        >
          {/* THUMBNAIL (Use standard img tag, styling handled by CSS) */}
          <div className="short-thumb-wrapper">
            <img
              src={item.thumbnail}
              alt={item.title}
            />
            {/* OVERLAY: Avatar & Name */}
            <div className="short-overlay">
              <img 
                src={channelAvatar} 
                alt={channelName}
                className="short-overlay-avatar"
                onError={(e) => (e.target.src = "/default-avatar.png")}
              />
              <span className="short-overlay-name">{channelName}</span>
            </div>
          </div>
        </div>
      );
    }

    // RENDER VIDEO CARD
    return (
      <div
        key={item._id}
        className="video-bar-card"
        onClick={() => navigate(`/watch/${item._id}`)}
      >
        {/* THUMBNAIL */}
        <img className="video-bar-thumb" src={item.thumbnail} alt={item.title} />

        {/* AVATAR + TITLE + CHANNEL */}
        <div className="video-bar-info">
          <img
            className="video-bar-avatar"
            src={channelAvatar}
            alt={channelName}
            onError={(e) => (e.target.src = "/default-avatar.png")}
          />
          <div className="video-bar-text-wrap">
            <div className="video-bar-text">{item.title}</div>
            <div className="video-bar-meta">
              <span className="video-bar-channel-name">{channelName}</span>
              <span>•</span>
              <span className="video-bar-time">{timeAgo(item.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="video-bar" style={{ padding: "8px 12px" }}>
      {/* SHORTS SECTION */}
      {shorts.length > 0 && (
        <div className="video-bar-section" style={{ marginBottom: 16 }}>
          <h3 className="video-bar-title">Shorts</h3>
          <div className="shorts-scroll-wrapper">
            <button
              className="shorts-scroll-btn left"
              onClick={() => scrollShorts("left")}
              aria-label="Scroll left"
            >
              &#8249;
            </button>
            <div className="video-bar-shorts" ref={shortsRef}>
              {shorts.map((s) => renderCard(s, true))}
            </div>
            <button
              className="shorts-scroll-btn right"
              onClick={() => scrollShorts("right")}
              aria-label="Scroll right"
            >
              &#8250;
            </button>
          </div>
        </div>
      )}

      {/* VIDEOS SECTION */}
      {videos.length > 0 && (
        <div className="video-bar-section">
          <h3 className="video-bar-title">Up Next</h3>
          <div className="video-bar-videos">
            {videos.map((v) => renderCard(v))}
          </div>
        </div>
      )}
    </div>
  );
}
