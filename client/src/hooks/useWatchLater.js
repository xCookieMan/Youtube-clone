import { useState, useEffect } from "react";
import { addToWatchLater, removeFromWatchLater, fetchWatchLaterIds } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const useWatchLater = (videoId) => {
  const { user } = useAuth();
  const showToast = useToast();
  
  const [isInWatchLater, setIsInWatchLater] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check status on mount
  useEffect(() => {
    if (!user || !videoId) {
      setIsInWatchLater(false);
      return;
    }

    const checkStatus = async () => {
      try {
        const ids = await fetchWatchLaterIds();
        if (Array.isArray(ids)) {
          // IDs can be strings or objects (though ids endpoint should return strings/ids)
          const exists = ids.some(id => String(id) === String(videoId));
          setIsInWatchLater(exists);
        }
      } catch (err) {
        console.error("Failed to check watch later status", err);
      }
    };

    checkStatus();
  }, [user, videoId]);

  const toggleWatchLater = async () => {
    if (!user) return false; // Component should handle redirect
    
    const prevState = isInWatchLater;
    setIsInWatchLater(!prevState); // Optimistic update
    setLoading(true);

    try {
      if (prevState) {
        await removeFromWatchLater(videoId);
        showToast("Removed from Watch Later", "success");
      } else {
        await addToWatchLater(videoId);
        showToast("Saved to Watch Later", "success");
      }
    } catch (err) {
      setIsInWatchLater(prevState); // Revert
      showToast("Failed to update Watch Later", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
    return true;
  };

  return { isInWatchLater, toggleWatchLater, loading };
};

export default useWatchLater;
