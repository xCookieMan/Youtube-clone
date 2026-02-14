import React, { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const CustomIcon = ({ name, alt }) => (
  <img
    src={`/assets/${name}-icon.svg`}
    alt={alt}
    className="sidebar-icon"
    onError={(e) => {
      e.target.onerror = null;
      e.target.src = "/assets/default-icon.svg";
    }}
  />
);

const SidebarItem = ({ active, onClick, icon, label, isExpanded }) => (
  <motion.div
    className={`sidebar-item ${active ? "active" : ""}`}
    onClick={onClick}
    role="button"
    tabIndex={0}
    whileHover={{ x: 4 }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: "spring", stiffness: 400, damping: 17 }}
  >
    <CustomIcon name={icon} alt={label} />
    {isExpanded && (
      <motion.span
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        {label}
      </motion.span>
    )}
  </motion.div>
);

export default function Sidebar({ isExpanded = true }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const showToast = useToast();

  const handleProtectedNav = useCallback(
    (path) => {
      if (!user) {
        showToast("Please log in to access this feature.", "error");
        navigate("/login", { state: { from: location } });
        return;
      }
      navigate(path);
    },
    [user, navigate, location, showToast]
  );

  const handleCategory = useCallback(
    (category) => {
      const path = `/category/${encodeURIComponent(category)}`;
      if (location.pathname === path) {
        navigate(path, { replace: true });
      } else {
        navigate(path);
      }
    },
    [navigate, location.pathname]
  );

  const isActive = (path) => location.pathname === path;
  const isActiveCategory = (category) =>
    location.pathname === `/category/${encodeURIComponent(category)}`;

  return (
    <div className={`sidebar ${isExpanded ? "expanded" : "collapsed"}`}>
      {/* Main Navigation */}
      <div className="sidebar-section">
        <SidebarItem
          active={isActive("/")}
          onClick={() => navigate("/")}
          icon="home"
          label="Home"
          isExpanded={isExpanded}
        />

        <SidebarItem
          active={isActive("/shorts")}
          onClick={() => navigate("/shorts")}
          icon="shorts"
          label="Shorts"
          isExpanded={isExpanded}
        />

        <SidebarItem
          active={false} // Subscriptions usually has its own active logic or handled by path
          onClick={() => handleProtectedNav("/subscriptions")}
          icon="subs"
          label="Subscriptions"
          isExpanded={isExpanded}
        />
      </div>

      <hr className="sidebar-divider" />

      {/* Categories */}
      <div className="sidebar-section">
        <SidebarItem
          active={isActiveCategory("Gaming")}
          onClick={() => handleCategory("Gaming")}
          icon="gaming"
          label="Gaming"
          isExpanded={isExpanded}
        />

        <SidebarItem
          active={isActiveCategory("Music")}
          onClick={() => handleCategory("Music")}
          icon="music"
          label="Music"
          isExpanded={isExpanded}
        />

        <SidebarItem
          active={isActiveCategory("News")}
          onClick={() => handleCategory("News")}
          icon="news"
          label="News"
          isExpanded={isExpanded}
        />

        <SidebarItem
          active={isActiveCategory("Sports")}
          onClick={() => handleCategory("Sports")}
          icon="sports"
          label="Sports"
          isExpanded={isExpanded}
        />
      </div>

      {/* "You" Section */}
      <div className="sidebar-you-section">
        {isExpanded && <hr className="sidebar-divider" />}

        {isExpanded && (
          <div className="sidebar-section-header">
            <span>You</span>
            <CustomIcon name="you" alt="You" />
          </div>
        )}

        <SidebarItem
          active={isActive("/history")}
          onClick={() => handleProtectedNav("/history")}
          icon="history"
          label="History"
          isExpanded={isExpanded}
        />

        <SidebarItem
          active={isActive("/liked")}
          onClick={() => handleProtectedNav("/liked")}
          icon="liked"
          label="Liked videos"
          isExpanded={isExpanded}
        />

        <SidebarItem
          active={isActive("/watch-later")}
          onClick={() => handleProtectedNav("/watch-later")}
          icon="watch-later"
          label="Watch later"
          isExpanded={isExpanded}
        />

        <SidebarItem
          active={isActive("/playlists")}
          onClick={() => handleProtectedNav("/playlists")}
          icon="playlist"
          label="Playlists"
          isExpanded={isExpanded}
        />

        <SidebarItem
          active={isActive("/videos")}
          onClick={() => handleProtectedNav("/videos")}
          icon="your-videos"
          label="Your videos"
          isExpanded={isExpanded}
        />
      </div>

      <hr className="sidebar-divider" />

      <SidebarItem
        active={isActive("/settings")}
        onClick={() => navigate("/settings")}
        icon="settings"
        label="Settings"
        isExpanded={isExpanded}
      />

      <SidebarItem
        active={isActive("/help")}
        onClick={() => navigate("/help")}
        icon="help"
        label="Help"
        isExpanded={isExpanded}
      />

      {/* Footer */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <hr className="sidebar-divider" />
          <div className="sidebar-footer">
            <div>About • Copyright</div>
            <div>Contact • Terms • Privacy</div>
            <div>© {new Date().getFullYear()} Google LLC</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
