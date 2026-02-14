import React, { useState, useEffect } from "react";
import {
  fetchUserPlaylists,
  createPlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  fetchWatchLaterIds,
  addToWatchLater,
  removeFromWatchLater,
} from "../../lib/api";
import { useToast } from "../../context/ToastContext";
import { BiX, BiPlus, BiLock, BiGlobe } from "react-icons/bi";

const SaveToPlaylistModal = ({ videoId, onClose }) => {
  const [playlists, setPlaylists] = useState([]);
  const [watchLaterIds, setWatchLaterIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const showToast = useToast();

  useEffect(() => {
    loadData();
  }, [videoId]);

  const loadData = async () => {
    try {
      const [playlistsData, wlIds] = await Promise.all([
        fetchUserPlaylists(),
        fetchWatchLaterIds(),
      ]);
      setPlaylists(playlistsData || []);
      setWatchLaterIds(wlIds || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load playlists", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleWatchLater = async (e) => {
    const isChecked = e.target.checked;
    try {
      if (isChecked) {
        await addToWatchLater(videoId);
        setWatchLaterIds((prev) => [...prev, videoId]);
        showToast("Added to Watch Later", "success");
      } else {
        await removeFromWatchLater(videoId);
        setWatchLaterIds((prev) => prev.filter((id) => id !== videoId));
        showToast("Removed from Watch Later", "success");
      }
    } catch (err) {
      showToast("Failed to update Watch Later", "error");
    }
  };

  const togglePlaylist = async (playlistId, isChecked) => {
    try {
      if (isChecked) {
        await addVideoToPlaylist(playlistId, videoId);
        showToast("Added to playlist", "success");
      } else {
        await removeVideoFromPlaylist(playlistId, videoId);
        showToast("Removed from playlist", "success");
      }
      // Update local state to reflect change (optimistic or re-fetch)
      setPlaylists((prev) =>
        prev.map((p) => {
          if (p._id === playlistId) {
             const hasVideo = p.videos.includes(videoId);
             if (isChecked && !hasVideo) {
               return { ...p, videos: [...p.videos, videoId] };
             } else if (!isChecked && hasVideo) {
               return { ...p, videos: p.videos.filter(v => v !== videoId && v._id !== videoId) };
             }
          }
          return p;
        })
      );
    } catch (err) {
      showToast("Failed to update playlist", "error");
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    try {
      const newPlaylist = await createPlaylist(newPlaylistName, isPrivate);
      setPlaylists((prev) => [newPlaylist, ...prev]);
      setNewPlaylistName("");
      setShowCreateForm(false);
      
      // Auto-add video to new playlist
      await addVideoToPlaylist(newPlaylist._id, videoId);
      setPlaylists((prev) =>
          prev.map(p => p._id === newPlaylist._id ? { ...p, videos: [videoId] } : p)
      );
      
      showToast("Playlist created and saved", "success");
    } catch (err) {
      showToast("Failed to create playlist", "error");
    }
  };

  // Check if video is in a playlist
  const isInPlaylist = (playlist) => {
    // videos array might contain objects or IDs
    return playlist.videos.some(v => String(v._id || v) === String(videoId));
  };

  if (!videoId) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        backgroundColor: '#212121', padding: '20px', borderRadius: '12px',
        width: '300px', color: 'white', maxHeight: '80vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Save to...</h3>
          <BiX size={24} onClick={onClose} style={{ cursor: 'pointer' }} />
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Watch Later */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={watchLaterIds.includes(videoId)}
                onChange={toggleWatchLater}
                style={{ width: '18px', height: '18px', accentColor: '#3ea6ff' }}
              />
              <span>Watch Later</span>
            </label>

            {/* User Playlists */}
            {playlists.map((playlist) => (
              <label key={playlist._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isInPlaylist(playlist)}
                  onChange={(e) => togglePlaylist(playlist._id, e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#3ea6ff' }}
                />
                <span>{playlist.name}</span>
                {playlist.isPrivate ? <BiLock size={14} color="#aaa" /> : <BiGlobe size={14} color="#aaa" />}
              </label>
            ))}
          </div>
        )}

        {/* Create New Playlist */}
        {!showCreateForm ? (
          <div
            onClick={() => setShowCreateForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px', cursor: 'pointer', padding: '10px 0' }}
          >
            <BiPlus size={24} />
            <span>Create new playlist</span>
          </div>
        ) : (
          <div style={{ marginTop: '15px' }}>
            <label style={{ fontSize: '12px', color: '#aaa' }}>Name</label>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Enter playlist name..."
              style={{
                width: '100%', padding: '8px', marginTop: '5px', marginBottom: '10px',
                background: 'transparent', border: '1px solid #555', color: 'white', borderRadius: '4px', outline: 'none'
              }}
            />
            
            <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '5px' }}>Privacy</label>
            <select
              value={isPrivate ? "private" : "public"}
              onChange={(e) => setIsPrivate(e.target.value === "private")}
              style={{
                width: '100%', padding: '8px', marginBottom: '15px',
                background: '#333', border: 'none', color: 'white', borderRadius: '4px'
              }}
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                    onClick={() => setShowCreateForm(false)}
                    style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer' }}
                >
                    Cancel
                </button>
              <button
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName.trim()}
                style={{
                  background: 'transparent', border: 'none', color: '#3ea6ff',
                  cursor: 'pointer', fontWeight: 'bold'
                }}
              >
                Create
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaveToPlaylistModal;
