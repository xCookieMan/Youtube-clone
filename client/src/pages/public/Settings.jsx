import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  updateAvatar,
  updateChannelName,
  deleteChannel,
  deleteAccount,
  fetchUserChannel,
  updateProfile,
} from "../../lib/api";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const { user, logout, checkAuth } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const [theme, setTheme] = useState("light");
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState(null);
  const [newName, setNewName] = useState("");
  const [userName, setUserName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // 'account' or 'channel'

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
    
    if (user) {
      setUserName(user.name || "");
      loadChannel();
    }
  }, [user]);

  const loadChannel = async () => {
    try {
      const res = await fetchUserChannel();
      // Backend returns the channel object directly or null
      if (res && res._id) {
        setChannel(res);
        setNewName(res.name);
      } else if (res && res.channel) {
        // Fallback in case backend structure changes
        setChannel(res.channel);
        setNewName(res.channel.name);
      } else {
        setChannel(null);
        setNewName("");
      }
    } catch (err) {
      setChannel(null);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    showToast(`Switched to ${newTheme} mode`, "success");
  };

  const handleUpdateProfile = async () => {
    if (!userName.trim() || userName === user.name) return;
    try {
      setLoading(true);
      await updateProfile({ name: userName });
      await checkAuth(); // Refresh user data
      showToast("Profile name updated", "success");
    } catch (err) {
      showToast(err.message || "Failed to update profile name", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setLoading(true);
      await updateAvatar(formData);
      await checkAuth(); // Refresh user data
      showToast("Avatar updated successfully", "success");
    } catch (err) {
      showToast(err.message || "Failed to update avatar", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChannelNameUpdate = async () => {
    if (!newName.trim()) return;
    try {
      setLoading(true);
      await updateChannelName(newName);
      await loadChannel(); // Refresh channel data
      showToast("Channel name updated", "success");
    } catch (err) {
      showToast(err.message || "Failed to update channel name", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChannel = async () => {
    try {
      setLoading(true);
      await deleteChannel();
      setChannel(null);
      setNewName("");
      showToast("Channel deleted successfully", "success");
      setShowDeleteConfirm(null);
    } catch (err) {
      showToast(err.message || "Failed to delete channel", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      await deleteAccount();
      logout();
      navigate("/");
      showToast("Account deleted successfully", "success");
    } catch (err) {
      showToast(err.message || "Failed to delete account", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page" style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "24px" }}>Settings</h2>

      {/* Theme Section */}
      <section className="settings-section" style={{ marginBottom: "32px" }}>
        <h3>Appearance</h3>
        <button 
          onClick={toggleTheme} 
          className="theme-toggle-btn"
          style={{
            padding: "10px 20px",
            borderRadius: "20px",
            border: "1px solid #ccc",
            background: "var(--bg-secondary)",
            color: theme === "dark" ? "white" : "black",
            cursor: "pointer",
            marginTop: "12px"
          }}
        >
          Switch to {theme === "dark" ? "Light" : "Dark"} Mode
        </button>
      </section>

      {user ? (
        <>
          <hr style={{ margin: "24px 0", borderColor: "var(--border-color)" }} />
          
          {/* Profile Section */}
          <section className="settings-section" style={{ marginBottom: "32px" }}>
            <h3>Profile</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginTop: "16px" }}>
              <div style={{ position: "relative" }}>
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }}
                />
                <label 
                  htmlFor="avatar-upload"
                  style={{
                    position: "absolute",
                    bottom: "0",
                    right: "0",
                    background: "var(--brand-color, #3ea6ff)",
                    color: "white",
                    padding: "4px",
                    borderRadius: "50%",
                    cursor: "pointer",
                    fontSize: "12px"
                  }}
                >
                  ✏️
                </label>
                <input 
                  type="file" 
                  id="avatar-upload" 
                  hidden 
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={loading}
                />
              </div>
              <div>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "var(--text-secondary)" }}>Profile Name</label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input 
                      type="text" 
                      value={userName} 
                      onChange={(e) => setUserName(e.target.value)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "4px",
                        border: "1px solid var(--border-color)",
                        width: "200px"
                      }}
                    />
                    <button 
                      onClick={handleUpdateProfile}
                      disabled={loading || userName === user.name}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "4px",
                        background: "var(--brand-color, #3ea6ff)",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                        opacity: (loading || userName === user.name) ? 0.6 : 1
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
                <p><strong>Email:</strong> {user.email}</p>
              </div>
            </div>
          </section>

          <hr style={{ margin: "24px 0", borderColor: "var(--border-color)" }} />

          {/* Channel Settings */}
          {channel && (
            <section className="settings-section" style={{ marginBottom: "32px" }}>
              <h3>Channel Settings</h3>
              <div style={{ marginTop: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px" }}>Channel Name</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input 
                    type="text" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "4px",
                      border: "1px solid var(--border-color)",
                      flex: "1",
                      maxWidth: "300px"
                    }}
                  />
                  <button 
                    onClick={handleChannelNameUpdate}
                    disabled={loading || newName === channel.name}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "4px",
                      background: "var(--brand-color, #3ea6ff)",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                      opacity: (loading || newName === channel.name) ? 0.6 : 1
                    }}
                  >
                    Update Name
                  </button>
                </div>
              </div>
            </section>
          )}

          <hr style={{ margin: "24px 0", borderColor: "var(--border-color)" }} />

          {/* Account Actions */}
          <section className="settings-section" style={{ marginBottom: "32px" }}>
            <h3>Account</h3>
            <button 
              onClick={logout}
              style={{
                padding: "10px 20px",
                borderRadius: "4px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
                cursor: "pointer",
                marginTop: "16px",
                fontWeight: "500",
                fontSize: "14px"
              }}
            >
              Logout
            </button>
          </section>

          <hr style={{ margin: "24px 0", borderColor: "var(--border-color)" }} />

          {/* Danger Zone */}
          <section className="settings-section" style={{ marginBottom: "32px" }}>
            <h3 style={{ color: "#cc0000" }}>Danger Zone</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
              {channel && (
                <div>
                  {showDeleteConfirm === 'channel' ? (
                    <div style={{ background: "#ffebee", padding: "16px", borderRadius: "8px" }}>
                      <p style={{ color: "#c62828", marginBottom: "12px" }}>Are you sure you want to delete your channel? This cannot be undone.</p>
                      <button 
                        onClick={handleDeleteChannel}
                        disabled={loading}
                        style={{ background: "#c62828", color: "white", padding: "8px 16px", borderRadius: "4px", border: "none", marginRight: "10px", cursor: "pointer" }}
                      >
                        Yes, Delete Channel
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(null)}
                        style={{ padding: "8px 16px", borderRadius: "4px", border: "1px solid #ccc", background: "white", cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowDeleteConfirm('channel')}
                      style={{ padding: "10px 20px", borderRadius: "4px", border: "1px solid #c62828", color: "#c62828", background: "transparent", cursor: "pointer" }}
                    >
                      Delete Channel
                    </button>
                  )}
                </div>
              )}

              <div>
                {showDeleteConfirm === 'account' ? (
                  <div style={{ background: "#ffebee", padding: "16px", borderRadius: "8px" }}>
                    <p style={{ color: "#c62828", marginBottom: "12px" }}>Are you sure you want to delete your account? All data will be lost permanently.</p>
                    <button 
                      onClick={handleDeleteAccount}
                      disabled={loading}
                      style={{ background: "#c62828", color: "white", padding: "8px 16px", borderRadius: "4px", border: "none", marginRight: "10px", cursor: "pointer" }}
                    >
                      Yes, Delete Account
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(null)}
                      style={{ padding: "8px 16px", borderRadius: "4px", border: "1px solid #ccc", background: "white", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowDeleteConfirm('account')}
                    style={{ padding: "10px 20px", borderRadius: "4px", border: "1px solid #c62828", color: "#c62828", background: "transparent", cursor: "pointer" }}
                  >
                    Delete Account
                  </button>
                )}
              </div>
            </div>
          </section>
        </>
      ) : (
        <div style={{ padding: "20px", background: "var(--bg-secondary)", borderRadius: "8px", textAlign: "center" }}>
          <p>Please log in to manage your account settings.</p>
          <button 
            onClick={() => navigate("/login")}
            style={{
              marginTop: "12px",
              padding: "8px 16px",
              background: "var(--brand-color, #3ea6ff)",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Login
          </button>
        </div>
      )}
    </div>
  );
}
