import React, { useState, useEffect } from "react";
import { fetchShorts } from "../../lib/api";
import { useToast } from "../../context/ToastContext";
import ShortsCard from "../../components/cards/ShortsCard";

export default function Shorts() {
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const showToast = useToast();
  const FALLBACK_SHORTS = [
    { _id: "f1", title: "Sample Short 1", thumbnail: "https://placehold.co/240x400?text=Short+1", views: 1200, channel: { name: "Demo" } },
    { _id: "f2", title: "Sample Short 2", thumbnail: "https://placehold.co/240x400?text=Short+2", views: 980, channel: { name: "Demo" } },
    { _id: "f3", title: "Sample Short 3", thumbnail: "https://placehold.co/240x400?text=Short+3", views: 2150, channel: { name: "Demo" } },
    { _id: "f4", title: "Sample Short 4", thumbnail: "https://placehold.co/240x400?text=Short+4", views: 640, channel: { name: "Demo" } },
    { _id: "f5", title: "Sample Short 5", thumbnail: "https://placehold.co/240x400?text=Short+5", views: 320, channel: { name: "Demo" } },
    { _id: "f6", title: "Sample Short 6", thumbnail: "https://placehold.co/240x400?text=Short+6", views: 1520, channel: { name: "Demo" } },
  ];

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadShorts = async () => {
      try {
        setError(null);
        const data = await fetchShorts({ signal: controller.signal });
        if (isMounted) {
          setShorts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load shorts:", err);
        if (isMounted) {
          setError(err.message || "Failed to load shorts. Please try again.");
          setShorts(FALLBACK_SHORTS);
          showToast("Shorts fetch failed, showing samples", "warning");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadShorts();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  return (
    <div className="shorts-page">
      <div className="shorts-section">
        <div className="shorts-header">
          <h2>Shorts</h2>
        </div>

        {error && (
          <div
            style={{
              padding: "16px",
              color: "#d32f2f",
              backgroundColor: "#ffebee",
              borderRadius: "8px",
              margin: "0 16px 16px",
              textAlign: "center",
              border: "1px solid #ffcdd2", // ✅ Added for consistency
            }}
          >
            {error}
          </div>
        )}

        <div className="shorts-grid">
          {loading ? (
            Array.from({ length: 8 }, (_, i) => (
              <ShortsCard key={`s-skel-${i}`} />
            ))
          ) : shorts.length > 0 ? (
            shorts.map((short) => <ShortsCard key={short._id} short={short} />)
          ) : !error ? (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "40px 20px",
                color: "#666",
              }}
            >
              No shorts available at the moment.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
