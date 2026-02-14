import { useState, useEffect, useRef } from "react";
import { searchVideos } from "../lib/api";

export default function useSearchSuggestions(query) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear suggestions for short/empty queries
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchSuggestions = async () => {
      try {
        const results = await searchVideos(query.trim(), 10, {
          signal: controller.signal,
        });

        // Deduplicate by title (case-insensitive)
        const seen = new Set();
        const uniqueTitles = [];
        for (const video of results) {
          const title = video.title?.trim();
          if (title && !seen.has(title.toLowerCase())) {
            seen.add(title.toLowerCase());
            uniqueTitles.push(title);
            if (uniqueTitles.length >= 5) break;
          }
        }

        if (!controller.signal.aborted) {
          setSuggestions(uniqueTitles);
          setLoading(false);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Search suggestions error:", err);
          if (!controller.signal.aborted) {
            setSuggestions([]);
            setLoading(false);
          }
        }
      }
    };

    // Debounce: wait 300ms after user stops typing
    const timer = setTimeout(fetchSuggestions, 300);

    // Cleanup on unmount or query change
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return { suggestions, loading };
}
