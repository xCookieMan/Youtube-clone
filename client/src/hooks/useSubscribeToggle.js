import { useState, useEffect, useMemo } from "react";
import { subscribeChannel } from "../lib/api";
import { useToast } from "../context/ToastContext";

const useSubscribeToggle = ({ channelId, initialSubscribers = [], userId }) => {
  const showToast = useToast();
  const [loading, setLoading] = useState(false);

  // Initialize state based on props
  // We only track count and status, not the full list of IDs
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const isValidUser = typeof userId === "string" && userId.trim().length > 0;

  // Sync with props
  useEffect(() => {
    const subs = Array.isArray(initialSubscribers) ? initialSubscribers : [];
    setSubscribersCount(subs.length);
    if (isValidUser) {
      setIsSubscribed(subs.some(id => id.toString() === userId));
    } else {
      setIsSubscribed(false);
    }
  }, [initialSubscribers, userId, isValidUser]);

  const toggleSubscribe = async () => {
    if (!channelId || !isValidUser || loading) return;

    // Optimistic UI update
    const previousIsSubscribed = isSubscribed;
    const previousCount = subscribersCount;

    setIsSubscribed(!previousIsSubscribed);
    setSubscribersCount(prev => previousIsSubscribed ? prev - 1 : prev + 1);

    try {
      setLoading(true);
      const res = await subscribeChannel(channelId);

      // Backend returns { subscribed: boolean, subscribers: number, ... }
      if (typeof res?.subscribed === 'boolean') {
        setIsSubscribed(res.subscribed);
      }
      
      if (typeof res?.subscribers === 'number') {
        setSubscribersCount(res.subscribers);
      }
      
    } catch (error) {
      // Rollback on failure
      setIsSubscribed(previousIsSubscribed);
      setSubscribersCount(previousCount);
      showToast(error.message || "Failed to update subscription", "error");
    } finally {
      setLoading(false);
    }
  };

  return {
    subscribersCount,
    isSubscribed,
    toggleSubscribe,
    loading,
  };
};

export default useSubscribeToggle;
