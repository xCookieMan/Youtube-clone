import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const WatchLaterContext = createContext();

export const useWatchLater = () => useContext(WatchLaterContext);

export const WatchLaterProvider = ({ children }) => {
    const [watchLater, setWatchLater] = useState([]);
    const [watchLaterIds, setWatchLaterIds] = useState(new Set());

    // Mock showToast for now
    const showToast = (message, type) => {
        console.log(`[${type.toUpperCase()}] ${message}`);
        // In a real app, this would trigger a toast notification
    };

    const addToWatchLater = async (videoId) => {
        try {
            // Optimistic update
            setWatchLaterIds(prev => new Set(prev).add(videoId));
            
            // API call would go here
            // const res = await axios.post(`/api/users/watch-later/${videoId}`);
            // return res.data;
            
            showToast("Added to Watch Later", "success");
            return { added: true };
        } catch (error) {
            // Revert on error
            setWatchLaterIds(prev => {
                const next = new Set(prev);
                next.delete(videoId);
                return next;
            });
            showToast("Failed to update Watch Later", "error");
            return { added: false, message: error.message };
        }
    };

    const removeFromWatchLater = async (videoId) => {
        try {
            // Optimistic update
            setWatchLaterIds(prev => {
                const next = new Set(prev);
                next.delete(videoId);
                return next;
            });

            // API call would go here
            // await axios.delete(`/api/users/watch-later/${videoId}`);
            
            showToast("Removed from Watch Later", "success");
        } catch (error) {
            // Revert on error
            setWatchLaterIds(prev => new Set(prev).add(videoId));
            showToast("Failed to update Watch Later", "error");
        }
    };

    const toggleWatchLater = async (videoId) => {
        const isAdded = watchLaterIds.has(videoId);
        if (isAdded) {
            await removeFromWatchLater(videoId);
        } else {
            await addToWatchLater(videoId);
        }
    };

    return (
        <WatchLaterContext.Provider value={{ 
            watchLater, 
            watchLaterIds, 
            addToWatchLater, 
            removeFromWatchLater,
            toggleWatchLater 
        }}>
            {children}
        </WatchLaterContext.Provider>
    );
};
