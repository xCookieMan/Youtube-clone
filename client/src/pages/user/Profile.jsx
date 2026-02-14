import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import {
  updateAvatar,
  fetchUserVideos,
  fetchUserChannel,
  subscribeChannel,
  fetchChannelById,
  fetchVideosByChannel,
  getApiBase,
} from "../../lib/api";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";
import VideoCard from "../../components/cards/VideoCard";
import ShortsCard from "../../components/cards/ShortsCard";
import { deleteChannel } from "../../lib/api";

/* ================= LOCAL AUTH HEADER (since api.js handles auth internally) ================= */
const getAuthHeaderLocal = () => {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return {};
    const user = JSON.parse(userStr);
    return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
  } catch {
    return {};
  }
};

export default function Profile() {
  const {
    user: currentUser,
    isAdmin,
    logout,
    updateUser,
    loading: authLoading,
  } = useAuth();
  const navigate = useNavigate();
  const { id: profileId } = useParams(); // if viewing other user's profile
  const showToast = useToast();

  const [profileUser, setProfileUser] = useState(currentUser);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [userVideos, setUserVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);

  const [hasChannel, setHasChannel] = useState(false);
  const [channel, setChannel] = useState(null);
  const [checkingChannel, setCheckingChannel] = useState(true);

  const [activeTab, setActiveTab] = useState("videos");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (channel && currentUser) {
      setSubscribed(channel.subscribers?.includes(currentUser._id));
    }
  }, [channel, currentUser]);

  /* ================= AUTH GUARD ================= */
  useEffect(() => {
    if (!currentUser && !authLoading) {
      navigate("/login", { replace: true });
    }
  }, [currentUser, authLoading, navigate]);

  /* ================= FETCH PROFILE USER ================= */
  useEffect(() => {
    // Viewing other user's profile or own
    if (!profileId || (currentUser && profileId === currentUser._id)) {
      setProfileUser(currentUser);
      return;
    }

    // Fetch other user's channel info
    const fetchOtherProfile = async () => {
      try {
        setCheckingChannel(true);
        // Assume profileId is Channel ID
        const ch = await fetchChannelById(profileId);
        if (ch) {
          setChannel(ch);
          setHasChannel(true);
          // If ch.owner is populated, use it. Else use channel info as user info fallback
          const owner = ch.owner && ch.owner._id ? ch.owner : { 
            _id: ch.owner || "unknown", 
            name: ch.name, 
            avatar: ch.icon 
          };
          setProfileUser(owner);
        } else {
          setProfileUser(null);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setProfileUser(null);
      } finally {
        setCheckingChannel(false);
      }
    };

    fetchOtherProfile();
  }, [profileId, currentUser]);

  /* ================= CHECK USER CHANNEL ================= */
  const checkChannel = useCallback(async () => {
    if (!currentUser) {
      setHasChannel(false);
      setChannel(null);
      setCheckingChannel(false);
      return;
    }

    try {
      const response = await fetchUserChannel();
      if (response && response._id) {
        setHasChannel(true);
        setChannel(response);
      } else if (response && response.channel) {
        setHasChannel(true);
        setChannel(response.channel);
      } else {
        setHasChannel(false);
        setChannel(null);
      }
    } catch {
      setHasChannel(false);
      setChannel(null);
    } finally {
      setCheckingChannel(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!profileId) {
      checkChannel();
    }
  }, [checkChannel, profileId]);

  /* ================= LOAD USER VIDEOS ================= */
  useEffect(() => {
    if (!profileUser && !channel) return;

    const loadUserVideos = async () => {
      try {
        setLoadingVideos(true);
        let videos = [];
        if (channel && channel._id) {
            videos = await fetchVideosByChannel(channel._id);
        } else {
            // Only for current user
             videos = await fetchUserVideos();
        }
        setUserVideos(Array.isArray(videos) ? videos : []);
      } catch (err) {
        console.error("Failed to load videos:", err);
        showToast("Failed to load videos", "error");
      } finally {
        setLoadingVideos(false);
      }
    };

    loadUserVideos();
  }, [profileUser, channel, showToast]);

  /* ================= AVATAR HANDLERS ================= */
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Avatar must be less than 5 MB", "error");
      return;
    }
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarFile(file);
  };

  const saveAvatar = async () => {
    if (!avatarFile) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("avatar", avatarFile);

    try {
      const data = await updateAvatar(formData);
      updateUser({ ...currentUser, avatar: data.avatar });
      showToast("Avatar updated successfully!", "success");
      setAvatarFile(null);
      setAvatarPreview("");
    } catch (err) {
      console.error("Avatar upload error:", err);
      showToast(err.message || "Something went wrong", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const cancelAvatarChange = () => {
    setAvatarPreview("");
    setAvatarFile(null);
  };

  /* ================= SUBSCRIBE / UNSUBSCRIBE ================= */
  const handleSubscribeToggle = async () => {
    if (!profileUser || !channel) return;
    try {
      const res = await subscribeChannel(channel._id);
      setSubscribed(res.subscribed);
      // Update subscriber count in channel state
      setChannel(prev => ({
        ...prev,
        subscribersCount: res.subscribers
      }));
    } catch (err) {
      console.error("Subscribe error:", err);
      showToast(err.message || "Failed to subscribe/unsubscribe", "error");
    }
  };

  /* ================= DELETE CHANNEL ================= */
  const handleDeleteChannel = async () => {
    if (profileUser._id !== currentUser._id) return;

    if (
      !window.confirm(
        "⚠️ This will permanently delete your channel and ALL your videos/shorts. Continue?"
      )
    )
      return;

    try {
      await deleteChannel();
      showToast("Channel and videos deleted successfully", "success");
      setHasChannel(false);
      setChannel(null);
      setUserVideos([]);
    } catch (err) {
      console.error("Delete channel error:", err);
      showToast(err.message || "Something went wrong", "error");
    }
  };

  /* ================= LOADING STATES ================= */
  if (authLoading || checkingChannel || !profileUser) {
    return (
      <div className="content" style={{ padding: "30px" }}>
        <LoadingSkeleton width="200px" height="32px" />
        <LoadingSkeleton width="150px" height="20px" />
        <LoadingSkeleton width="100%" height="200px" />
      </div>
    );
  }

  const videos = userVideos.filter((v) => !v.isShort);
  const shorts = userVideos.filter((v) => v.isShort);
  const avatarSrc =
    avatarPreview || profileUser.avatar || "/default-avatar.png";

  const isOwner = currentUser?._id === profileUser?._id;
  // Show subscribe button for owner too (even if no channel) so they can see the layout
  const showSubscribeButton = hasChannel || isOwner;

  /* ================= UI ================= */
  return (
    <div className="content" style={{ padding: "30px" }}>
      {/* Centered Profile Header */}
      <div
        className="profile-header-centered"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "24px",
          marginBottom: "40px",
        }}
      >
        {/* Avatar (Left) */}
        <div className="profile-avatar-wrapper" style={{ position: "relative" }}>
          <img
            src={avatarSrc}
            alt="Profile"
            className="profile-avatar"
            style={{ width: "128px", height: "128px", borderRadius: "50%", objectFit: "cover" }}
            onError={(e) => (e.target.src = "/default-avatar.png")}
            onClick={() =>
              isOwner && document.getElementById("avatar-input")?.click()
            }
          />
          {isOwner && (
            <input
              type="file"
              id="avatar-input"
              className="avatar-upload-input"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />
          )}

          {avatarPreview && isOwner && (
            <div className="avatar-actions" style={{ position: "absolute", bottom: -40, left: 0, right: 0, display: "flex", gap: 5 }}>
              <button onClick={saveAvatar} disabled={uploadingAvatar}>
                Save
              </button>
              <button onClick={cancelAvatarChange}>Cancel</button>
            </div>
          )}
        </div>

        {/* Info Block (Right of Avatar) */}
        <div className="profile-info-block" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          
          <div className="profile-main-row" style={{ display: "flex", alignItems: "flex-end", gap: "12px" }}>
            {/* Name & Admin Wrapper */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {/* Admin / Achievement Badge (Above Name) */}
              {isOwner && isAdmin && (
                <div className="role-badge" style={{ fontSize: "12px", color: "#FFD700", fontWeight: "bold", marginBottom: "4px" }}>
                  👑 Admin
                </div>
              )}
              {/* Name */}
              <h1 style={{ fontSize: "24px", margin: 0, lineHeight: "1" }}>
                {hasChannel ? channel?.name : profileUser.name}
              </h1>
            </div>

            {/* Subscribe Section (Right of Name) */}
            <div className="subscribe-section" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {/* Total Subscribers (Above Button) */}
              <span style={{ fontSize: "12px", color: "#606060", marginBottom: "2px" }}>
                {channel?.subscribersCount ?? (channel?.subscribers?.length || 0)} subscribers
              </span>

              {/* Subscribe/Unsubscribe Button */}
              {showSubscribeButton && (
                <button
                  onClick={isOwner ? () => showToast("You cannot subscribe to your own channel", "error") : handleSubscribeToggle}
                  disabled={isOwner && !isAdmin} // Optional: keep it clickable for admin or just show toast
                  style={{
                    padding: "8px 16px",
                    borderRadius: "18px",
                    background: isOwner ? "#ccc" : (subscribed ? "#f2f2f2" : "#0f0f0f"),
                    color: isOwner ? "#666" : (subscribed ? "#0f0f0f" : "#fff"),
                    border: "none",
                    cursor: isOwner ? "not-allowed" : "pointer",
                    fontWeight: "500",
                    fontSize: "14px"
                  }}
                >
                  {isOwner ? "Subscribe" : (subscribed ? "Unsubscribe" : "Subscribe")}
                </button>
              )}
            </div>
          </div>

          {/* Tag (Below Name) */}
          <div className="profile-tag" style={{ color: "#606060", fontSize: "14px" }}>
            @{hasChannel && channel?.name ? channel.name.replace(/\s+/g, "").toLowerCase() : profileUser.name.replace(/\s+/g, "").toLowerCase()}
          </div>
        </div>
      </div>

      {/* ================= TABS ================= */}
      <div className="profile-tabs" style={{ display: "flex", borderBottom: "1px solid #e5e5e5", marginBottom: "24px" }}>
        <button
          onClick={() => setActiveTab("videos")}
          style={{
            flex: 1,
            padding: "12px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "videos" ? "2px solid #0f0f0f" : "none",
            color: activeTab === "videos" ? "#0f0f0f" : "#606060",
            fontWeight: "500",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          Videos
        </button>
        <button
          onClick={() => setActiveTab("shorts")}
          style={{
            flex: 1,
            padding: "12px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "shorts" ? "2px solid #0f0f0f" : "none",
            color: activeTab === "shorts" ? "#0f0f0f" : "#606060",
            fontWeight: "500",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          Shorts
        </button>
      </div>

      {/* ================= CONTENT AREA ================= */}
      {activeTab === "videos" && (
        <div className="user-videos-section">
          {loadingVideos ? (
            <div className="video-grid-three-col">
              {Array.from({ length: 3 }).map((_, i) => (
                <VideoCard key={`loading-${i}`} />
              ))}
            </div>
          ) : videos.length > 0 ? (
            <div className="video-grid-three-col">
              {videos.map((video) => (
                <VideoCard 
                  key={video._id} 
                  video={{
                    ...video,
                    channel: video.channel?.name ? video.channel : (channel || { name: profileUser.name, icon: profileUser.avatar }),
                    owner: video.owner?.name ? video.owner : profileUser
                  }} 
                />
              ))}
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "#606060", marginTop: "40px" }}>
              {isOwner ? "You haven't uploaded any videos yet." : "No videos yet."}
            </p>
          )}
        </div>
      )}

      {activeTab === "shorts" && (
        <div className="user-shorts-section">
          <div className="shorts-grid">
            {loadingVideos ? (
              Array.from({ length: 4 }).map((_, i) => (
                <ShortsCard key={`loading-short-${i}`} />
              ))
            ) : shorts.length > 0 ? (
              shorts.map((short) => (
                <ShortsCard 
                  key={short._id} 
                  short={{
                    ...short,
                    channel: short.channel?.name ? short.channel : (channel || { name: profileUser.name, icon: profileUser.avatar }),
                    owner: short.owner?.name ? short.owner : profileUser
                  }} 
                />
              ))
            ) : (
              <p style={{ textAlign: "center", color: "#606060", marginTop: "40px" }}>
                {isOwner ? "You haven't uploaded any shorts yet." : "No shorts yet."}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ================= ACTIONS & ADMIN ================= */}
      {/* Settings button moved to top right */}
    </div>
  );
}
