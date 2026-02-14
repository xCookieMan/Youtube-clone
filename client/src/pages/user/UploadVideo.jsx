import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { uploadVideo, fetchUserChannel } from "../../lib/api";

export default function UploadVideo() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [previewUrl, setPreviewUrl] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [hasChannel, setHasChannel] = useState(false);
  const [checkingChannel, setCheckingChannel] = useState(true);

  const categories = [
    "General",
    "Music",
    "Gaming",
    "Sports",
    "News",
    "Movies",
    "Education",
    "Tech",
    "Comedy",
  ];

  // ------------------- CHECK IF USER HAS CHANNEL -------------------
  const checkChannel = useCallback(async () => {
    if (!user) {
      setHasChannel(false);
      setCheckingChannel(false);
      return;
    }
    try {
      const response = await fetchUserChannel();
      if (response?.success && response?.channel) setHasChannel(true);
      else setHasChannel(false);
    } catch {
      setHasChannel(false);
    } finally {
      setCheckingChannel(false);
    }
  }, [user]);

  useEffect(() => {
    checkChannel();
  }, [checkChannel]);

  useEffect(() => {
    if (authLoading || checkingChannel) return;
    if (!user || !hasChannel) navigate("/channel/create", { replace: true });
  }, [user, hasChannel, authLoading, checkingChannel, navigate]);

  // ------------------- CLEAN UP OBJECT URLS -------------------
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [previewUrl, thumbnailPreview]);

  // ------------------- HANDLE VIDEO FILE -------------------
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setVideoFile(null);
      setPreviewUrl("");
      setVideoDuration(0);
      return;
    }
    setError("");
    if (!file.type.startsWith("video/")) {
      setError("Please select a valid video file (MP4, MOV, etc.)");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("File size must be less than 50 MB.");
      return;
    }

    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      setVideoDuration(Math.floor(video.duration || 0));
      URL.revokeObjectURL(video.src);
    };
    const url = URL.createObjectURL(file);
    video.src = url;
    setPreviewUrl(url);
    setVideoFile(file);
  };

  // ------------------- HANDLE THUMBNAIL FILE -------------------
  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setThumbnailFile(null);
      setThumbnailPreview("");
      return;
    }
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image (JPG, PNG).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Thumbnail must be less than 5 MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    setThumbnailPreview(url);
    setThumbnailFile(file);
  };

  // ------------------- HANDLE SUBMIT -------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError("Title is required.");
    if (!description.trim()) return setError("Description is required.");
    if (!videoFile) return setError("Video file is required.");

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("category", category);
      formData.append("video", videoFile);
      formData.append("duration", parseInt(videoDuration) || 0);
      if (thumbnailFile) formData.append("thumbnail", thumbnailFile);

      await uploadVideo(formData);
      setSuccess(true);
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------- HANDLE CANCEL -------------------
  const handleCancel = () => {
    if (title.trim() || description.trim() || videoFile) {
      if (!window.confirm("Are you sure you want to discard this upload?"))
        return;
    }
    navigate("/");
  };

  if (authLoading || checkingChannel || !user || !hasChannel) return null;

  return (
    <div className="content" style={{ padding: "30px", maxWidth: "800px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "16px",
        }}
      >
        <button
          type="button"
          onClick={handleCancel}
          aria-label="Cancel upload"
          style={{
            background: "none",
            border: "1px solid #ccc",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#666",
            fontSize: "18px",
          }}
        >
          ✕
        </button>
      </div>

      <h2>📤 Upload Video</h2>

      {error && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#ffebee",
            color: "#c62828",
            border: "1px solid #ffcdd2",
            borderRadius: "4px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#e8f5e9",
            color: "#2e7d32",
            border: "1px solid #c8e6c9",
            borderRadius: "4px",
            marginBottom: "16px",
          }}
        >
          ✅ Video uploaded! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label>Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            placeholder="Add a title"
          />
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
            disabled={loading}
            placeholder="Tell viewers about your video"
          />
        </div>

        <div className="form-group">
          <label>Category *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px",
              backgroundColor: "white",
            }}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Video File *</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Custom Thumbnail (Optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
            disabled={loading}
          />
          {thumbnailPreview && (
            <div style={{ marginTop: "8px" }}>
              <img
                src={thumbnailPreview}
                alt="Thumbnail preview"
                style={{
                  width: "100%",
                  maxHeight: "200px",
                  objectFit: "cover",
                  borderRadius: "4px",
                }}
              />
            </div>
          )}
        </div>

        {videoDuration > 0 && (
          <div className="form-group">
            <label>Duration</label>
            <div
              style={{
                padding: "8px",
                backgroundColor: "#f5f5f5",
                borderRadius: "4px",
              }}
            >
              {videoDuration <= 60
                ? `✅ Short (${videoDuration}s)`
                : `📹 Video (${videoDuration}s)`}
            </div>
          </div>
        )}

        {previewUrl && (
          <div className="preview-section">
            <h4>Video Preview</h4>
            <div
              style={{
                position: "relative",
                width: "100%",
                paddingBottom: "56.25%",
                backgroundColor: "#000",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <video
                src={previewUrl}
                controls
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          className="upload-submit-btn"
          disabled={loading || !videoFile}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#cc0000",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            cursor: loading || !videoFile ? "not-allowed" : "pointer",
            opacity: loading || !videoFile ? 0.7 : 1,
          }}
        >
          {loading ? "Uploading..." : "Upload Video"}
        </button>
      </form>
    </div>
  );
}
