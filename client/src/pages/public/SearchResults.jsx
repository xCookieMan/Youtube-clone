import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { searchVideos } from "../../lib/api";
import VideoCard from "../../components/cards/VideoCard";
import ShortsCard from "../../components/cards/ShortsCard";

export default function SearchResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  const getSearchQuery = () => {
    const params = new URLSearchParams(location.search);
    return params.get("q")?.trim() || "";
  };

  const loadSearchResults = async (query) => {
    if (!query) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await searchVideos(query);
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Search failed:", err);
      setError(err.message || "Failed to search. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const query = getSearchQuery();
    loadSearchResults(query);
  }, [location.search]);

  const query = getSearchQuery();

  // ✅ FIXED: Proper Shorts detection with number conversion
  const { shorts, videos } = useMemo(() => {
    return results.reduce(
      (acc, item) => {
        // ✅ Handle both number and string duration
        const duration = Number(item.duration) || 0;
        if (duration > 0 && duration <= 60) {
          acc.shorts.push(item);
        } else {
          acc.videos.push(item);
        }
        return acc;
      },
      { shorts: [], videos: [] }
    );
  }, [results]);

  return (
    <div style={{ padding: "16px" }}>
      <h2 style={{ marginBottom: "24px" }}>
        Search Results{query && ` for "${query}"`}
      </h2>

      {error && (
        <div
          style={{
            padding: "20px",
            color: "#d32f2f",
            backgroundColor: "#ffebee",
            borderRadius: "8px",
            marginBottom: "24px",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}

      {shorts.length > 0 && (
        <section className="section-mb">
          <h3 className="section-title">Shorts</h3>
          <div className="shorts-container">
            {shorts.map((short) => (
              <ShortsCard key={short._id} short={short} />
            ))}
          </div>
        </section>
      )}

      {videos.length > 0 && (
        <section>
          <h3 className="section-title">Videos</h3>
          <div className="video-grid-three-col">
            {videos.map((video) => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>
        </section>
      )}

      {!loading && !error && results.length === 0 && query && (
        <div className="no-results">
          <h3>No results found</h3>
          <p>Try different keywords or check your spelling</p>
        </div>
      )}

      {loading && (
        <>
          {/* ✅ FIXED: Separate loading states for Shorts and Videos */}
          <section className="section-mb">
            <h3 className="section-title">Shorts</h3>
            <div className="shorts-container">
              {Array.from({ length: 4 }).map((_, i) => (
                <ShortsCard key={`short-loading-${i}`} />
              ))}
            </div>
          </section>
          <section>
            <h3 className="section-title">Videos</h3>
            <div className="video-grid-three-col">
              {Array.from({ length: 6 }).map((_, i) => (
                <VideoCard key={`video-loading-${i}`} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
