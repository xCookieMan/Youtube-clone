import React, { useState, useEffect } from "react";
import { fetchShorts } from "../../lib/api";
import ShortsCard from "../../components/cards/ShortsCard";

export default function Shorts() {
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadShorts = async () => {
      try {
        setError(null);
        const data = await fetchShorts();
        if (isMounted) {
          setShorts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load shorts:", err);
        if (isMounted) {
          setError(err.message || "Failed to load shorts. Please try again.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadShorts();

    return () => {
      isMounted = false;
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
