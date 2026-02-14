import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { fetchVideoById, addComment, replyToComment, addToHistory } from "../../lib/api";
import useEngagement from "../../hooks/useEngagement";
import useSubscribeToggle from "../../hooks/useSubscribeToggle";
import useWatchLater from "../../hooks/useWatchLater";
import SaveToPlaylistModal from "../../components/modals/SaveToPlaylistModal";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";
import VideoBar from "./VideoBar";
import { BiLike, BiSolidLike, BiDislike, BiSolidDislike, BiListPlus, BiCheck, BiSave } from "react-icons/bi";

const EMPTY_ARRAY = [];

export default function VideoPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(true);

  // Reply states
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [expandedComments, setExpandedComments] = useState({});
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [initialSeekDone, setInitialSeekDone] = useState(false);
  const videoRef = useRef(null);
  const progressInterval = useRef(null);

  const toggleReplies = (commentId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleReplyClick = (commentId) => {
    if (replyingTo === commentId) {
      // Close everything
      setReplyingTo(null);
      setExpandedComments((prev) => ({
        ...prev,
        [commentId]: false,
      }));
    } else {
      // Open everything
      setReplyingTo(commentId);
      setExpandedComments((prev) => ({
        ...prev,
        [commentId]: true,
      }));
    }
  };

  const handleNestedReply = (commentId, username) => {
    setReplyingTo(commentId);
    setExpandedComments((prev) => ({
      ...prev,
      [commentId]: true,
    }));
    setReplyText(`@${username} `);
  };

  const loadVideo = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await fetchVideoById(id);
      setVideo(data);
      
      // Set initial progress if available
      if (data && data.userProgress > 0) {
        // We can't set video.currentTime here because video element might not be ready
        // We'll do it in onLoadedMetadata or similar
      }

      // We'll handle history updates via interval/progress, not just on load
    } catch (err) {
      toast("Video not found", "error");
      navigate("/");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    loadVideo();
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [loadVideo]);

  // Handle video progress and history
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    // Seek to saved progress once when video is ready
    if (!initialSeekDone && video && video.userProgress > 0 && videoRef.current.duration) {
       videoRef.current.currentTime = video.userProgress;
       setInitialSeekDone(true);
    } else if (!initialSeekDone && videoRef.current.duration) {
       setInitialSeekDone(true); // No progress to restore
    }
  };

  // Save progress periodically
  useEffect(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    
    progressInterval.current = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused && video) {
        const currentTime = videoRef.current.currentTime;
        const duration = videoRef.current.duration;
        if (currentTime > 5) { // Only save if watched more than 5 seconds
          addToHistory(id, currentTime, duration).catch(console.error);
        }
      }
    }, 10000); // Save every 10 seconds

    return () => clearInterval(progressInterval.current);
  }, [id, video]);

  // Engagement hook
  const {
    likesCount,
    dislikesCount,
    isLiked,
    isDisliked,
    toggleLike,
    toggleDislike,
    loading: likeLoading,
  } = useEngagement({
    videoId: id,
    initialLikes: video?.likes || EMPTY_ARRAY,
    initialDislikes: video?.dislikes || EMPTY_ARRAY,
    userId: user?._id,
  });

  // Subscribe toggle hook
  const {
    subscribersCount,
    isSubscribed,
    toggleSubscribe,
    loading: subLoading,
  } = useSubscribeToggle({
    channelId: video?.channel?._id,
    initialSubscribers: video?.channel?.subscribers || EMPTY_ARRAY,
    userId: user?._id,
  });

  // Watch Later hook
  const { isInWatchLater, toggleWatchLater, loading: wlLoading } = useWatchLater(id);

  const goToAuth = () => {
    navigate("/login", { state: { from: window.location.pathname } });
  };

  const handleLike = async () => {
    if (!user) return goToAuth();
    await toggleLike();
  };

  const handleSubscribe = async () => {
    if (!user) return goToAuth();
    if (!video?.channel?._id) return;
    await toggleSubscribe();
  };

  const handleWatchLater = async () => {
    if (!user) return goToAuth();
    await toggleWatchLater();
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;

    const text = commentText.trim();
    setCommentText("");

    const tempComment = {
      _id: `temp-${Date.now()}`,
      text,
      user: {
        _id: user._id,
        name: user.name || "User",
        avatar: user.avatar || "/default-avatar.png",
      },
    };

    setVideo((prev) => ({
      ...prev,
      comments: [tempComment, ...(prev?.comments || [])],
    }));

    try {
      const res = await addComment(id, text);
      const actualComment = res.comment || res;
      setVideo((prev) => ({
        ...prev,
        comments: prev.comments.map((c) =>
          c._id === tempComment._id ? actualComment : c
        ),
      }));
    } catch (err) {
      console.error("Comment failed:", err);
      toast("Comment failed", "error");
      setVideo((prev) => ({
        ...prev,
        comments: prev.comments.filter((c) => c._id !== tempComment._id),
      }));
      setCommentText(text);
    }
  };

  const handleReplySubmit = async (e, commentId) => {
    e.preventDefault();
    if (!user || !replyText.trim()) return;

    try {
      const res = await replyToComment(id, commentId, replyText);
      const actualReply = res.reply || res;
      
      setVideo((prev) => ({
        ...prev,
        comments: prev.comments.map((c) => {
          if (c._id === commentId) {
            return {
              ...c,
              replies: [...(c.replies || []), actualReply],
            };
          }
          return c;
        }),
      }));
      setReplyText("");
      setReplyingTo(null);
    } catch (err) {
      console.error("Reply failed", err);
      toast("Reply failed", "error");
    }
  };

  if (loading) {
    return (
      <div className="watch-page">
        <div className="watch-video">
          <LoadingSkeleton height="60vh" style={{ borderRadius: 12, marginBottom: 16 }} />
          <LoadingSkeleton height={32} width="80%" style={{ marginBottom: 12 }} />
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
             <LoadingSkeleton height={40} width={40} style={{ borderRadius: "50%" }} />
             <div style={{ flex: 1 }}>
               <LoadingSkeleton height={16} width="200px" style={{ marginBottom: 4 }} />
               <LoadingSkeleton height={12} width="150px" />
             </div>
          </div>
        </div>
        <VideoBar loading={true} />
      </div>
    );
  }

  if (!video) return <div>Video not found</div>;

  const channelOwner = video.channel?.owner;
  const isOwner =
    channelOwner && user?._id
      ? String(user._id) === String(channelOwner._id)
      : false;

  const avatar = channelOwner?.avatar || "/default-avatar.png";
  const name = channelOwner?.name || "Anonymous";

  return (
    <motion.div
      className="watch-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* ===== MAIN VIDEO SECTION ===== */}
      <div className="watch-video">
        <video 
          ref={videoRef}
          src={video.url} 
          controls 
          className="watch-player" 
          onTimeUpdate={handleTimeUpdate}
        />

        <h1 className="watch-title">{video.title}</h1>

        {/* CHANNEL ROW */}
        <div
          className="watch-channel"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            marginBottom: 16,
          }}
        >
          {/* Avatar + Name */}
          <div
            style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
            onClick={() => navigate(`/channel/${video.channel?._id}`)}
          >
            <img
              src={avatar}
              alt={name}
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                objectFit: "cover",
                marginRight: 12,
              }}
              onError={(e) => (e.target.src = "/default-avatar.png")}
            />
            <div>
              <strong>{name}</strong>
              <div style={{ fontSize: 12, color: "#606060" }}>
                {subscribersCount} subscribers
              </div>
            </div>
          </div>

          {/* Subscribe button */}
          <motion.button
            onClick={handleSubscribe}
            disabled={subLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: "6px 14px",
              borderRadius: "18px",
              border: "none",
              fontWeight: "bold",
              background: isSubscribed ? "#272727" : "#cc0000",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {isSubscribed ? "Subscribed" : "Subscribe"}
          </motion.button>
        </div>

        {/* ENGAGEMENT BUTTONS */}
        <div className="watch-buttons" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", background: "#f2f2f2", borderRadius: "18px", overflow: "hidden" }}>
            <motion.button
              onClick={handleLike}
              disabled={likeLoading}
              whileTap={{ scale: 0.95 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "transparent",
                border: "none",
                padding: "6px 12px",
                cursor: "pointer",
                borderRight: "1px solid #ccc"
              }}
            >
              {isLiked ? <BiSolidLike size={18} /> : <BiLike size={18} />} {likesCount}
            </motion.button>
            <motion.button
              onClick={() => user ? toggleDislike() : navigate("/login", { state: { from: location } })}
              disabled={likeLoading}
              whileTap={{ scale: 0.95 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "transparent",
                border: "none",
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              {isDisliked ? <BiSolidDislike size={18} /> : <BiDislike size={18} />} {dislikesCount}
            </motion.button>
          </div>

          <motion.button
            onClick={handleWatchLater}
            disabled={wlLoading}
            whileTap={{ scale: 0.95 }}
            style={{
              display: "flex",
              alignItems: "center",
              background: isInWatchLater ? "#0f0f0f" : "#f2f2f2",
              color: isInWatchLater ? "#fff" : "#0f0f0f",
              border: "none",
              padding: "10px",
              borderRadius: "50%",
              cursor: "pointer",
              marginLeft: "8px",
              fontWeight: "500",
              width: "40px",
              height: "40px",
              justifyContent: "center"
            }}
            title={isInWatchLater ? "Remove from Watch Later" : "Watch Later"}
          >
            {isInWatchLater ? <BiCheck size={20} /> : <BiListPlus size={20} />}
          </motion.button>

          <motion.button
            onClick={() => {
              if (user) {
                setShowSaveModal(true);
              } else {
                goToAuth();
              }
            }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: "flex",
              alignItems: "center",
              background: "#f2f2f2",
              color: "#0f0f0f",
              border: "none",
              padding: "10px",
              borderRadius: "50%",
              cursor: "pointer",
              marginLeft: "8px",
              fontWeight: "500",
              width: "40px",
              height: "40px",
              justifyContent: "center"
            }}
            title="Save to playlist"
          >
            <BiSave size={20} />
          </motion.button>
          
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            ⬇ Download
          </motion.button>
          <motion.button
            onClick={() => setShowComments((p) => !p)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showComments ? "Hide Info" : "Show Info"}
          </motion.button>
        </div>

        {/* DESCRIPTION */}
        <div 
          className="watch-desc-box"
          style={{
            background: "#f2f2f2",
            borderRadius: "12px",
            padding: "12px",
            marginTop: "12px",
            marginBottom: "24px",
            cursor: "pointer",
            position: "relative"
          }}
          onClick={() => setIsDescExpanded(!isDescExpanded)}
        >
          <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "8px" }}>
            {video.views ? Number(video.views).toLocaleString() : 0} views •{" "}
            {video.createdAt && !isNaN(new Date(video.createdAt).getTime())
              ? new Date(video.createdAt).toLocaleDateString()
              : "Recently"}
          </div>
          <p 
            className="watch-desc"
            style={{
              fontSize: "14px",
              lineHeight: "1.4",
              whiteSpace: "pre-wrap",
              display: "-webkit-box",
              WebkitLineClamp: isDescExpanded ? "unset" : 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              color: "#0f0f0f"
            }}
          >
            {video.description || "No description available."}
          </p>
          <button
            style={{
              background: "none",
              border: "none",
              fontWeight: "bold",
              fontSize: "14px",
              marginTop: "8px",
              cursor: "pointer",
              padding: 0,
              color: "#0f0f0f"
            }}
          >
            {isDescExpanded ? "Show less" : "...more"}
          </button>
        </div>

        {/* COMMENTS */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              className="watch-comments"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3>Comments ({video.comments?.length || 0})</h3>

              {user ? (
                <form onSubmit={handleAddComment} className="comment-form">
                  <img
                    src={user.avatar || "/default-avatar.png"}
                    alt="You"
                    className="comment-avatar"
                    onError={(e) => (e.target.src = "/default-avatar.png")}
                  />
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="comment-input"
                  />
                  <button type="submit" className="comment-submit-btn">Comment</button>
                </form>
              ) : (
                <p className="login-prompt">Login to comment</p>
              )}

              <div className="comment-list">
                {(video.comments || []).map((c) => (
                  <div key={c._id || c.text} className="comment-item">
                    <img
                      src={c.user?.avatar || "/default-avatar.png"}
                      alt=""
                      className="comment-avatar"
                      onError={(e) => (e.target.src = "/default-avatar.png")}
                    />
                    <div className="comment-content" style={{ width: "100%" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <strong>{c.user?.name || "User"}</strong>
                            <span style={{ fontSize: 12, color: "#aaa" }}>
                              {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p style={{ marginTop: 4 }}>{c.text}</p>
                        </div>

                        {/* Right-side Buttons */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginLeft: 16, gap: 4 }}>
                          <button 
                            onClick={() => handleReplyClick(c._id)}
                            style={{ 
                              background: "none", 
                              border: "none", 
                              color: "#aaa", 
                              cursor: "pointer", 
                              fontSize: 13,
                              fontWeight: "bold",
                              padding: "4px 8px",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {replyingTo === c._id ? "Cancel" : "Reply"}
                          </button>
                        </div>
                      </div>

                      {/* Reply Form */}
                      {replyingTo === c._id && (
                        <form 
                          onSubmit={(e) => handleReplySubmit(e, c._id)} 
                          className="comment-form"
                          style={{ marginTop: 10, padding: 0, border: "none" }}
                        >
                          <img
                            src={user?.avatar || "/default-avatar.png"}
                            alt="You"
                            className="comment-avatar"
                            style={{ width: 24, height: 24 }}
                          />
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Add a reply..."
                            className="comment-input"
                            autoFocus
                            style={{ padding: "6px 10px", fontSize: 13 }}
                          />
                          <button type="submit" className="comment-submit-btn" style={{ fontSize: 13, padding: "6px 12px" }}>Reply</button>
                        </form>
                      )}

                      {/* Nested Replies */}
                      {expandedComments[c._id] && c.replies && c.replies.length > 0 && (
                        <div className="replies-list" style={{ marginTop: 12, paddingLeft: 0 }}>
                          {c.replies.map((r) => (
                            <div key={r._id} className="reply-item" style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                              <img
                                src={r.user?.avatar || "/default-avatar.png"}
                                alt=""
                                style={{ width: 24, height: 24, borderRadius: "50%" }}
                                onError={(e) => (e.target.src = "/default-avatar.png")}
                              />
                              <div>
                                <div style={{ fontSize: 13, fontWeight: "bold" }}>{r.user?.name || "User"}</div>
                                <div style={{ fontSize: 13, marginTop: 2 }}>{r.text}</div>
                                <button
                                  onClick={() => handleNestedReply(c._id, r.user?.name || "User")}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "#aaa",
                                    cursor: "pointer",
                                    fontSize: 12,
                                    fontWeight: "bold",
                                    padding: "2px 0",
                                    marginTop: "2px",
                                  }}
                                >
                                  Reply
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT SIDEBAR */}
      <VideoBar
        shorts={video.relatedShorts || []}
        videos={video.relatedVideos || []}
        loading={loading}
      />
    {showSaveModal && (
        <SaveToPlaylistModal
          videoId={id}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </motion.div>
  );
}
