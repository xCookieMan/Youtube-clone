import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fetchVideos, fetchShorts } from "../../lib/api";
import VideoCard from "../../components/cards/VideoCard";
import ShortsCard from "../../components/cards/ShortsCard";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [shorts, setShorts] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [loadingShorts, setLoadingShorts] = useState(true);

  useEffect(() => {
    document.body.classList.add("home-page");

    const loadData = async () => {
      try {
        const [videosData, shortsData] = await Promise.all([
          fetchVideos(),
          fetchShorts(),
        ]);

        setVideos(Array.isArray(videosData) ? videosData : []);
        setShorts(Array.isArray(shortsData) ? shortsData : []);
      } catch (err) {
        console.error("Failed to load home content:", err);
        setVideos([]);
        setShorts([]);
      } finally {
        setLoadingVideos(false);
        setLoadingShorts(false);
      }
    };

    loadData();

    return () => {
      document.body.classList.remove("home-page");
    };
  }, []);

  return (
    <div className="home-container" style={{ padding: "20px" }}>
      {/* ================= SHORTS ================= */}
      <section className="shorts-section">
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          Shorts
        </motion.h2>
        <motion.div
          className="shorts-container"
          style={{
            display: "flex",
            gap: "12px",
            overflowX: "auto",
            paddingBottom: "10px",
          }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {loadingShorts ? (
            Array.from({ length: 5 }).map((_, i) => (
              <ShortsCard key={`s-skel-${i}`} />
            ))
          ) : shorts.length > 0 ? (
            shorts.map((short) => <ShortsCard key={short._id} short={short} />)
          ) : (
            <div className="empty-state">No shorts available</div>
          )}
        </motion.div>
      </section>

      {/* ================= VIDEOS ================= */}
      <motion.section
        className="video-grid-three-col"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "16px",
          marginTop: "24px",
        }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {loadingVideos ? (
          Array.from({ length: 6 }).map((_, i) => (
            <VideoCard key={`v-skel-${i}`} />
          ))
        ) : videos.length > 0 ? (
          videos.map((video) => <VideoCard key={video._id} video={video} />)
        ) : (
          <div className="empty-state full-width">No videos available</div>
        )}
      </motion.section>
    </div>
  );
}
