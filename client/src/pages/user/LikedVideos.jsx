import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import VideoCard from "../../components/cards/VideoCard";
import { fetchLikedVideos } from "../../lib/api";

export default function LikedVideos() {
  const { user, loading: authLoading } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user !== null) {
      setLoading(true);
      setError(null);
    }

    if (!user) {
      setLoading(false);
      setError(null);
      return;
    }

    const loadLikedVideos = async () => {
      try {
        const data = await fetchLikedVideos();
        setVideos(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error("Failed to load liked videos:", err);
        setError(
          err.message || "Failed to load liked videos. Please try again."
        );
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    loadLikedVideos();
  }, [user]);

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="auth-container">
        <div
          className="auth-card"
          style={{ padding: "20px", textAlign: "center" }}
        >
          Please log in to view liked videos.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 16px" }}>
      <h2
        style={{ marginBottom: "16px", fontSize: "24px", fontWeight: "bold" }}
      >
        Liked Videos
      </h2>

      {error && (
        <div
          style={{
            padding: "16px",
            color: "#d32f2f",
            backgroundColor: "#ffebee",
            borderRadius: "8px",
            marginBottom: "16px",
            textAlign: "center",
            border: "1px solid #ffcdd2",
          }}
        >
          {error}
        </div>
      )}

      <div className="video-grid-three-col">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <VideoCard key={i} />)
        ) : videos.length > 0 ? (
          videos.map((video) => <VideoCard key={video._id} video={video} />)
        ) : !error ? (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: "40px 16px",
              textAlign: "center",
              color: "#666",
            }}
          >
            No liked videos yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}
