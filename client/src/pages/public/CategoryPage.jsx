import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import VideoCard from "../../components/cards/VideoCard"; // ✅ Fixed import path
import { fetchVideosByCategory } from "../../lib/api"; // ✅ Fixed import path

// ✅ Single source of truth for category mappings
const CATEGORY_LABELS = {
  general: "General",
  music: "Music",
  gaming: "Gaming",
  sports: "Sports",
  news: "News",
  movies: "Movies",
  education: "Education",
  tech: "Tech",
  comedy: "Comedy",
};

const getCategoryLabel = (param) => {
  if (!param) return "General";
  const key = param.toLowerCase();
  return CATEGORY_LABELS[key] || "General";
};

export default function CategoryPage() {
  const { category } = useParams();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const categoryLabel = useMemo(() => getCategoryLabel(category), [category]);

  useEffect(() => {
    let isMounted = true;

    const loadVideos = async () => {
      setLoading(true);
      try {
        const data = await fetchVideosByCategory(category);
        if (!isMounted) return;

        // Handle both array response and { videos: [] } format
        const videoList = Array.isArray(data) ? data : data?.videos || [];

        setVideos(videoList);
      } catch (err) {
        console.error("Failed to load category videos:", err);
        if (isMounted) setVideos([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadVideos();

    return () => {
      isMounted = false;
    };
  }, [category]);

  return (
    <div className="category-page">
      <h2 className="category-title">{categoryLabel}</h2>

      <div className="video-grid-three-col">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <VideoCard key={`skeleton-${i}`} />
          ))
        ) : videos.length > 0 ? (
          videos.map((video) => <VideoCard key={video._id} video={video} />)
        ) : (
          <div className="empty-state full-width">
            No videos available in this category.
          </div>
        )}
      </div>
    </div>
  );
}
