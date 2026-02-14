import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useNavigate } from "react-router-dom";
import { getApiBase, request } from "../../lib/api";

export default function ChannelCreate() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();

  const [channelName, setChannelName] = useState("");
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if user already has a channel
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      showToast("Please log in to create a channel.", "error");
      navigate("/login", { replace: true });
      return;
    }

    const checkExistingChannel = async () => {
      try {
        const res = await request("/channels"); // uses token automatically
        if (res?.channel) {
          showToast("You already have a channel!", "info");
          navigate("/profile", { replace: true });
        }
      } catch (err) {
        console.warn("Channel check error:", err);
        // Allow creation if check fails
      }
    };

    checkExistingChannel();
  }, [user, authLoading, navigate, showToast]);

  // Clean up icon preview URL when component unmounts or icon changes
  useEffect(() => {
    return () => {
      if (iconPreview) URL.revokeObjectURL(iconPreview);
    };
  }, [iconPreview]);

  // Handle channel icon selection
  const handleIconChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please upload a valid image (JPG, PNG, GIF).", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be less than 5 MB.", "error");
      return;
    }

    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!channelName.trim()) {
      showToast("Channel name is required.", "error");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", channelName.trim());
      if (iconFile) formData.append("icon", iconFile);

      await request("/channels", {
        method: "POST",
        body: formData,
      });

      showToast("Channel created successfully!", "success");
      navigate("/profile", { replace: true });
    } catch (err) {
      console.error("Channel creation error:", err);
      showToast(
        err.message || "Something went wrong. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="content" style={{ padding: "30px", maxWidth: "600px" }}>
      <h2>Create Your Channel</h2>
      <form onSubmit={handleSubmit} className="channel-form">
        <div className="form-group">
          <label>Channel Icon (Optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleIconChange}
            disabled={loading}
          />
          {iconPreview && (
            <div className="icon-preview">
              <img
                src={iconPreview}
                alt="Channel icon preview"
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  marginTop: "10px",
                }}
              />
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Channel Name *</label>
          <input
            type="text"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            placeholder="e.g. Cooking with Nakul"
            disabled={loading}
            required
          />
        </div>

        <button type="submit" className="channel-submit-btn" disabled={loading}>
          {loading ? "Creating Channel..." : "Create Channel"}
        </button>
      </form>
    </div>
  );
}
