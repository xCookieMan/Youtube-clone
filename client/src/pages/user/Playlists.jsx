import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "../../context/ToastContext";
import { fetchUserPlaylists, createPlaylist } from "../../lib/api";

export default function Playlists() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const navigate = useNavigate();
  const showToast = useToast();

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const data = await fetchUserPlaylists();
      setPlaylists(data || []);
    } catch (error) {
      console.error("Failed to load playlists:", error);
      showToast("Failed to load playlists", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    setCreating(true);
    try {
      const newPlaylist = await createPlaylist(newPlaylistName, isPrivate);
      setPlaylists([newPlaylist, ...playlists]);
      setShowCreateModal(false);
      setNewPlaylistName("");
      setIsPrivate(false);
      showToast("Playlist created successfully", "success");
    } catch (error) {
      console.error("Failed to create playlist:", error);
      showToast(error.message || "Failed to create playlist", "error");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  return (
    <div className="playlists-page">
      <div className="page-header">
        <h1>Your Playlists</h1>
        <button 
          className="playlist-create-btn"
          onClick={() => setShowCreateModal(true)}
        >
          Create Playlist
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="empty-state">
          <p>You haven't created any playlists yet.</p>
          <button 
            className="secondary-btn"
            onClick={() => setShowCreateModal(true)}
          >
            Create your first playlist
          </button>
        </div>
      ) : (
        <div className="playlists-grid">
          {playlists.map((playlist) => (
            <motion.div 
              key={playlist._id}
              className="playlist-card"
              whileHover={{ y: -4 }}
              onClick={() => navigate(`/playlist/${playlist._id}`)}
            >
              <div className="playlist-thumbnail">
                {playlist.videos && playlist.videos.length > 0 ? (
                  <>
                    <img 
                      src={playlist.videos[0]?.thumbnail} 
                      alt={playlist.name} 
                    />
                    <div className="video-count-overlay">
                      <span>{playlist.videos.length}</span>
                      <small>VIDEOS</small>
                    </div>
                  </>
                ) : (
                  <div className="empty-thumbnail">
                    <span>Empty</span>
                  </div>
                )}
              </div>
              <div className="playlist-info">
                <h3>{playlist.name}</h3>
                <p>{playlist.videos?.length || 0} videos • {playlist.isPrivate ? "Private" : "Public"}</p>
                <span className="view-link">View full playlist</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Create New Playlist</h2>
            <form onSubmit={handleCreatePlaylist}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Enter playlist name"
                  autoFocus
                  required
                />
              </div>
              
              <div className="form-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                  />
                  Private Playlist
                </label>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={creating || !newPlaylistName.trim()}
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
