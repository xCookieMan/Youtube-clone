import { useState, useEffect } from "react";
import { likeVideo, dislikeVideo } from "../lib/api";
import { useToast } from "../context/ToastContext";

const useEngagement = ({ videoId, initialLikes = [], initialDislikes = [], userId }) => {
  // Helper to check if user interact
  const checkHasUser = (arr, uid) => {
    if (!uid || !arr) return false;
    return arr.some((id) => {
      // Handle both populated object and ID string cases
      const strId = typeof id === "string" ? id : id?._id || id;
      return String(strId) === String(uid);
    });
  };

  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [loading, setLoading] = useState(false);
  const showToast = useToast();

  useEffect(() => {
    setLikesCount(initialLikes.length || 0);
    setDislikesCount(initialDislikes.length || 0);
    setIsLiked(checkHasUser(initialLikes, userId));
    setIsDisliked(checkHasUser(initialDislikes, userId));
  }, [videoId, initialLikes, initialDislikes, userId]);

  const toggleLike = async () => {
    if (!videoId || !userId || loading) return;

    // Optimistic Update
    const prevLiked = isLiked;
    const prevDisliked = isDisliked;
    const prevLikesCount = likesCount;
    const prevDislikesCount = dislikesCount;

    // Logic:
    // If currently liked: remove like.
    // If currently NOT liked: add like. IF it was disliked, remove dislike.
    
    if (prevLiked) {
      setIsLiked(false);
      setLikesCount(prevLikesCount - 1);
    } else {
      setIsLiked(true);
      setLikesCount(prevLikesCount + 1);
      if (prevDisliked) {
        setIsDisliked(false);
        setDislikesCount(prevDislikesCount - 1);
      }
    }

    try {
      setLoading(true);
      const res = await likeVideo(videoId);
      
      if (res) {
        setIsLiked(res.liked);
        setIsDisliked(res.disliked);
        setLikesCount(res.likes);
        setDislikesCount(res.dislikes);
      }
    } catch (error) {
      console.error("Like toggle failed:", error);
      showToast("Failed to update like", "error");
      // Rollback
      setIsLiked(prevLiked);
      setIsDisliked(prevDisliked);
      setLikesCount(prevLikesCount);
      setDislikesCount(prevDislikesCount);
    } finally {
      setLoading(false);
    }
  };

  const toggleDislike = async () => {
    if (!videoId || !userId || loading) return;

    // Optimistic Update
    const prevLiked = isLiked;
    const prevDisliked = isDisliked;
    const prevLikesCount = likesCount;
    const prevDislikesCount = dislikesCount;

    if (prevDisliked) {
      setIsDisliked(false);
      setDislikesCount(prevDislikesCount - 1);
    } else {
      setIsDisliked(true);
      setDislikesCount(prevDislikesCount + 1);
      if (prevLiked) {
        setIsLiked(false);
        setLikesCount(prevLikesCount - 1);
      }
    }

    try {
      setLoading(true);
      const res = await dislikeVideo(videoId);
      
      if (res) {
        setIsLiked(res.liked);
        setIsDisliked(res.disliked);
        setLikesCount(res.likes);
        setDislikesCount(res.dislikes);
      }
    } catch (error) {
      console.error("Dislike toggle failed:", error);
      showToast("Failed to update dislike", "error");
      // Rollback
      setIsLiked(prevLiked);
      setIsDisliked(prevDisliked);
      setLikesCount(prevLikesCount);
      setDislikesCount(prevDislikesCount);
    } finally {
      setLoading(false);
    }
  };

  return {
    likesCount,
    dislikesCount,
    isLiked,
    isDisliked,
    toggleLike,
    toggleDislike,
    loading,
  };
};

export default useEngagement;
