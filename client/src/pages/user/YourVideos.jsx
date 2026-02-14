import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import VideoCard from "../../components/cards/VideoCard";
import { fetchUserVideos } from "../../lib/api";

export default function YourVideos() {
  const { user, loading: authLoading } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadVideos = async () => {
      if (authLoading || !user) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        if (isMounted) setLoading(true);
        setError(null);
        const data = await fetchUserVideos();
        if (!isMounted) return;
        // Filter out shorts to only show long-form videos
        const videosOnly = (Array.isArray(data) ? data : []).filter(v => !v.isShort);
        setVideos(videosOnly);
      } catch (err) {
        console.error("Failed to load your videos:", err);
        if (isMounted) {
          setError(
            err.message || "Failed to load your videos. Please try again."
          );
          setVideos([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadVideos();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="auth-container">
        <div
          className="auth-card"
          style={{ padding: "20px", textAlign: "center" }}
        >
          Please log in to view your videos.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 16px" }}>
      <h2 style={{ marginBottom: "16px" }}>Your Videos</h2>

      {error && (
        <div
          style={{
            padding: "20px",
            color: "#d32f2f",
            backgroundColor: "#ffebee",
            borderRadius: "8px",
            marginBottom: "16px",
            textAlign: "center",
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
          <p style={{ padding: "20px" }}>No videos uploaded yet.</p>
        ) : null}
      </div>
    </div>
  );
}
