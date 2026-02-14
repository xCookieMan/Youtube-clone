import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import VideoCard from "../../components/cards/VideoCard";
import { fetchHistory } from "../../lib/api";

export default function History() {
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

    const loadHistory = async () => {
      try {
        const data = await fetchHistory();
        setVideos(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error("Failed to load history:", err);
        setError(
          err.message || "Failed to load watch history. Please try again."
        );
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user]);

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="auth-container">
        <div
          className="auth-card"
          style={{ padding: "20px", textAlign: "center" }}
        >
          Please log in to view history.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ padding: "0 16px 16px" }}>Watch History</h2>

      {error && (
        <div
          style={{
            padding: "20px",
            color: "#d32f2f",
            backgroundColor: "#ffebee",
            borderRadius: "8px",
            margin: "0 16px 16px",
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
          <p style={{ padding: "20px" }}>No watch history yet.</p>
        ) : null}
      </div>
    </div>
  );
}
