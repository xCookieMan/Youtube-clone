import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchSubscribedChannels, subscribeChannel } from "../../lib/api";
import { useNavigate } from "react-router-dom";

export default function Subscriptions() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setChannels([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadSubscriptions = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchSubscribedChannels();

        // Normalize response
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.channels)
          ? data.channels
          : [];

        if (mounted) setChannels(list.filter((ch) => ch?._id));
      } catch (err) {
        console.error("Subscriptions load failed:", err);
        if (mounted) {
          setError(
            err.message ||
              "Failed to load subscriptions. Please try again later."
          );
          setChannels([]);
        }
      } finally {
        mounted && setLoading(false);
      }
    };

    loadSubscriptions();

    return () => {
      mounted = false;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ padding: 20, textAlign: "center" }}>
          Please log in to view subscriptions.
        </div>
      </div>
    );
  }

  const handleChannelClick = (id) => {
    if (!id) return;
    navigate(`/profile/${id}`);
  };

  const toggleSubscribe = async (channelId) => {
    if (!channelId) return;
    try {
      const res = await subscribeChannel(channelId);

      // Update UI locally
      setChannels((prev) =>
        prev.map((ch) =>
          ch._id === channelId
            ? { 
                ...ch, 
                // Backend now returns subscribers count as 'subscribers'
                // We store it in a new property or assume existing logic needs update
                // But since we can't reconstruct the array, we'll just update the count if we had it
                // Or better, since we don't have the count in the list item (we do, but as array length),
                // we should update the array to be a fake array of correct length? No, that's ugly.
                // Let's just update the channel object to include a subscribersCount property
                // and update the render logic to use it.
                subscribersCount: res.subscribers,
                isSubscribed: res.subscribed
              } 
            : ch
        )
      );
    } catch (err) {
      console.error("Failed to toggle subscription:", err);
      alert(err.message || "Subscription action failed.");
    }
  };

  return (
    <div style={{ padding: "0 16px" }}>
      <h2 style={{ marginBottom: 16, fontSize: 24, fontWeight: "bold" }}>
        Subscriptions
      </h2>

      {error && (
        <div
          style={{
            padding: 16,
            marginBottom: 16,
            color: "#d32f2f",
            background: "#ffebee",
            borderRadius: 8,
            textAlign: "center",
            border: "1px solid #ffcdd2",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 12,
              padding: 12,
              borderBottom: "1px solid #eee",
            }}
          >
            <div
              className="skeleton"
              style={{ width: 48, height: 48, borderRadius: "50%" }}
            />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 16, width: "70%" }} />
              <div
                className="skeleton"
                style={{ height: 12, width: "50%", marginTop: 6 }}
              />
            </div>
          </div>
        ))
      ) : channels.length > 0 ? (
        channels.map((channel) => {
          const avatar =
            channel.icon || channel.owner?.avatar || "/default-avatar.png";

          // Use the updated boolean if available, otherwise fallback to array check
          const isSubscribed = 
            typeof channel.isSubscribed === 'boolean' 
              ? channel.isSubscribed 
              : channel.subscribers?.includes(user._id);

          return (
            <div
              key={channel._id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 12,
                borderBottom: "1px solid #eee",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  cursor: "pointer",
                }}
                onClick={() =>
                  handleChannelClick(channel._id)
                }
              >
                <img
                  src={avatar}
                  alt={channel.name || "Channel"}
                  onError={(e) => (e.currentTarget.src = "/default-avatar.png")}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
                <div>
                  <div style={{ fontWeight: "bold", fontSize: 14 }}>
                    {channel.name || "Unnamed Channel"}
                  </div>
                  <div style={{ fontSize: 12, color: "#606060" }}>
                    {/* Prefer updated count, fallback to array length */}
                    {channel.subscribersCount ?? (channel.subscribers?.length || 0)} subscribers
                  </div>
                </div>
              </div>

              {/* Subscribe/Unsubscribe Button */}
              {user._id !== channel.owner?._id && (
                <button
                  onClick={() => toggleSubscribe(channel._id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "18px",
                    border: "none",
                    background: isSubscribed ? "#272727" : "#cc0000",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  {isSubscribed ? "Subscribed" : "Subscribe"}
                </button>
              )}
            </div>
          );
        })
      ) : (
        <div
          style={{ padding: "40px 16px", textAlign: "center", color: "#666" }}
        >
          You haven't subscribed to any channels yet.
        </div>
      )}
    </div>
  );
}
