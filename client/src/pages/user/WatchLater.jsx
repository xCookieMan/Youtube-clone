import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import VideoCard from "../../components/cards/VideoCard";
import { fetchWatchLater } from "../../lib/api";

export default function WatchLater() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError(null);
      return;
    }

    const loadWatchLater = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchWatchLater();
        setVideos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load watch later:", err);
        setError(
          err.message || "Failed to load watch later. Please try again."
        );
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    loadWatchLater();
  }, [user]);

  if (!user) {
    return (
      <div className="auth-container">
        <div
          className="auth-card"
          style={{ padding: "20px", textAlign: "center" }}
        >
          Please log in to view watch later.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 16px" }}>
      <h2 style={{ marginBottom: "16px" }}>Watch Later</h2>

      {error && (
        <div className="error-message-box">
          {error}
        </div>
      )}

      <div className="video-grid-three-col">
        {loading ? (
          Array.from({ length: 6 }, (_, i) => (
            <VideoCard key={`skeleton-${i}`} />
          ))
        ) : videos.length > 0 ? (
          videos.map((video) => <VideoCard key={video._id} video={video} />)
        ) : !error ? (
          <p className="empty-message">No videos in watch later.</p>
        ) : null}
      </div>
    </div>
  );
}
