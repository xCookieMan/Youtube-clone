import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { fetchVideoById, addComment, replyToComment, addToHistory } from "../../lib/api";
import useEngagement from "../../hooks/useEngagement";
import useSubscribeToggle from "../../hooks/useSubscribeToggle";
import useWatchLater from "../../hooks/useWatchLater";
import { BiLike, BiSolidLike, BiCommentDetail, BiVolumeFull, BiVolumeMute, BiDislike, BiSolidDislike, BiListPlus, BiCheck } from "react-icons/bi";

const EMPTY_ARRAY = [];

export default function ShortsPlayer() {
  const { id } = useParams();
  const { user } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef(null);

  const [short, setShort] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isMuted, setIsMuted] = useState(true);

  // Reply states
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [expandedComments, setExpandedComments] = useState({});

  const handleReplyClick = (commentId) => {
    if (replyingTo === commentId) {
      setReplyingTo(null);
      setExpandedComments((prev) => ({ ...prev, [commentId]: false }));
    } else {
      setReplyingTo(commentId);
      setExpandedComments((prev) => ({ ...prev, [commentId]: true }));
    }
  };

  const handleNestedReply = (commentId, username) => {
    setReplyingTo(commentId);
    setExpandedComments((prev) => ({ ...prev, [commentId]: true }));
    setReplyText(`@${username} `);
  };

  /* ================= LOAD SHORT ================= */
  const loadShort = useCallback(async () => {
    if (!id) {
      navigate("/");
      return;
    }

    try {
      setLoading(true);
      const data = await fetchVideoById(id);

      if (!data || !data.isShort) {
        throw new Error("Short not found");
      }

      setShort(data);
      if (data) {
        addToHistory(id).catch(err => console.error("Failed to add history", err));
      }
    } catch (err) {
      console.error(err);
      showToast("Short not found", "error");
      navigate("/");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    loadShort();
  }, [loadShort]);

  /* ================= LIKE ================= */
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
    initialLikes: short?.likes || EMPTY_ARRAY,
    initialDislikes: short?.dislikes || EMPTY_ARRAY,
    userId: user?._id,
  });

  /* ================= SUBSCRIBE ================= */
  const {
    subscribersCount,
    isSubscribed,
    toggleSubscribe,
    loading: subLoading,
  } = useSubscribeToggle({
    channelId: short?.channel?._id,
    initialSubscribers: short?.channel?.subscribers || EMPTY_ARRAY,
    userId: user?._id,
  });

  // Watch Later
  const { isInWatchLater, toggleWatchLater, loading: wlLoading } = useWatchLater(id);

  const goToAuth = () => {
    navigate("/login", { state: { from: location } });
  };

  const handleWatchLater = async () => {
    if (!user) return goToAuth();
    await toggleWatchLater();
  };

  const handleLike = async () => {
    if (!user) return goToAuth();
    await toggleLike();
  };

  const handleSubscribe = async () => {
    if (!user) return goToAuth();
    if (!short?.channel?._id) return;
    await toggleSubscribe();
  };

  /* ================= COMMENTS ================= */
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

    setShort((prev) => ({
      ...prev,
      comments: [tempComment, ...(prev.comments || [])],
    }));

    try {
      const res = await addComment(id, text);
      const actual = res.comment || res;

      setShort((prev) => ({
        ...prev,
        comments: prev.comments.map((c) =>
          c._id === tempComment._id ? actual : c
        ),
      }));
    } catch (err) {
      showToast("Failed to send comment", "error");
      setShort((prev) => ({
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
      
      setShort((prev) => ({
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
      showToast("Reply failed", "error");
    }
  };

  if (loading || !short) return null;

  /* ================= OWNER CHECK ================= */
  const channelOwner = short.channel?.owner;
  const isChannelOwner =
    channelOwner && user?._id
      ? String(user._id) === String(channelOwner._id)
      : false;

  const avatar = channelOwner?.avatar || "/default-avatar.png";
  const name = channelOwner?.name || "Anonymous";

  /* ================= RENDER ================= */
  return (
    <div className="shorts-player-page">
      {/* BLUR BG */}
      <div
        className="shorts-bg"
        style={{ backgroundImage: `url(${short.thumbnail})` }}
      />

      {/* MAIN LAYOUT */}
      <div className={`shorts-layout ${showComments ? "comments-open" : ""}`}>
        {/* ================= VIDEO ================= */}
        <div className="shorts-video-wrapper">
          <video
            ref={videoRef}
            src={short.url}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="shorts-video"
          />

          {/* OVERLAY */}
          <div className="shorts-overlay" style={{ justifyContent: "flex-end" }}>
            <div style={{ paddingRight: "60px", marginBottom: "16px" }}>
              <div className="shorts-user-info" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <img src={avatar} alt={name} />
                <span style={{ fontWeight: "bold" }}>{name}</span>

                <button
                  type="button"
                  className={`subscribe-btn ${
                    isSubscribed ? "subscribed" : ""
                  }`}
                  onClick={handleSubscribe}
                  disabled={subLoading}
                  style={{
                    marginLeft: "0",
                    padding: "6px 12px",
                    borderRadius: "18px",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: "500",
                    cursor: "pointer",
                    background: isSubscribed ? "#272727" : "#cc0000",
                    color: "#fff",
                    pointerEvents: "auto",
                    zIndex: 10
                  }}
                >
                  {isSubscribed ? "Subscribed" : "Subscribe"}
                </button>
              </div>

              <p className="shorts-title">{short.title}</p>
            </div>

            {/* ACTIONS */}
            <div className="shorts-actions">
              <button
                className="action-btn"
                onClick={handleLike}
                disabled={likeLoading}
              >
                <span className="icon">
                  {isLiked ? <BiSolidLike /> : <BiLike />}
                </span>
                <span className="count">{likesCount}</span>
              </button>

              <button
                className="action-btn"
                onClick={() => user ? toggleDislike() : navigate("/login", { state: { from: location } })}
                disabled={likeLoading}
              >
                <span className="icon">
                  {isDisliked ? <BiSolidDislike /> : <BiDislike />}
                </span>
              </button>

              <button
                className="action-btn"
                onClick={handleWatchLater}
                disabled={wlLoading}
              >
                <span className="icon">
                  {isInWatchLater ? <BiCheck /> : <BiListPlus />}
                </span>
              </button>

              <button
                className="action-btn"
                onClick={() => setShowComments((v) => !v)}
              >
                <span className="icon">
                  <BiCommentDetail />
                </span>
                <span className="count">{short.comments?.length || 0}</span>
              </button>

              <button
                className="action-btn"
                onClick={() => setIsMuted((m) => !m)}
              >
                <span className="icon">
                  {isMuted ? <BiVolumeMute /> : <BiVolumeFull />}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ================= COMMENTS (RIGHT SIDE) ================= */}
        {showComments && (
          <aside className="shorts-comments-panel">
            <div className="comments-header">
              <h3>Comments</h3>
              <button onClick={() => setShowComments(false)}>✕</button>
            </div>

            <div className="comments-list">
              {(short.comments || []).map((c) => (
                <div className="comment-item" key={c._id}>
                  <img src={c.user?.avatar || "/default-avatar.png"} alt="" />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong>{c.user?.name || "User"}</strong>
                      <button 
                        onClick={() => handleReplyClick(c._id)}
                        style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: "12px" }}
                      >
                        {replyingTo === c._id ? "Cancel" : "Reply"}
                      </button>
                    </div>
                    <p>{c.text}</p>

                    {/* Reply Form */}
                    {replyingTo === c._id && (
                      <form 
                        onSubmit={(e) => handleReplySubmit(e, c._id)} 
                        className="comment-form"
                        style={{ marginTop: 8, padding: 0, border: "none" }}
                      >
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Add a reply..."
                          autoFocus
                          style={{ fontSize: 13, padding: "6px" }}
                        />
                        <button type="submit" style={{ fontSize: 12, padding: "4px 8px" }}>Reply</button>
                      </form>
                    )}

                    {/* Nested Replies */}
                    {expandedComments[c._id] && c.replies && c.replies.length > 0 && (
                      <div className="replies-list" style={{ marginTop: 8, paddingLeft: 8, borderLeft: "2px solid #333" }}>
                        {c.replies.map((r) => (
                          <div key={r._id} className="reply-item" style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                            <img
                              src={r.user?.avatar || "/default-avatar.png"}
                              alt=""
                              style={{ width: 20, height: 20, borderRadius: "50%" }}
                            />
                            <div>
                              <div style={{ fontSize: 12, fontWeight: "bold" }}>{r.user?.name || "User"}</div>
                              <div style={{ fontSize: 12 }}>{r.text}</div>
                              <button
                                onClick={() => handleNestedReply(c._id, r.user?.name || "User")}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#aaa",
                                  cursor: "pointer",
                                  fontSize: 10,
                                  fontWeight: "bold",
                                  padding: "2px 0",
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

            {user && (
              <form className="comment-form" onSubmit={handleAddComment}>
                <img src={user.avatar || "/default-avatar.png"} alt="" />
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                />
                <button type="submit">➤</button>
              </form>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
