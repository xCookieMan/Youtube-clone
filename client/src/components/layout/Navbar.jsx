import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import useSearchSuggestions from "../../hooks/useSearchSuggestions";

// ================= ICONS =================
const Icons = {
  Youtube: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="url(#paint0_linear)" />
        <path d="M21.5 16L12.5 21.1962L12.5 10.8038L21.5 16Z" fill="white" />
        <defs>
          <linearGradient id="paint0_linear" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF0000" />
            <stop offset="1" stopColor="#FF8A00" />
          </linearGradient>
        </defs>
      </svg>
      <span style={{ 
        fontFamily: '"Oswald", sans-serif', 
        fontSize: '20px', 
        fontWeight: 'bold', 
        letterSpacing: '-0.5px',
        background: 'linear-gradient(to right, #000 0%, #333 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        display: 'flex',
        alignItems: 'center'
      }}>
        Stream
        <span style={{ color: '#FF0000', WebkitTextFillColor: '#FF0000' }}>Tube</span>
      </span>
    </div>
  ),
  Menu: () => (
    <img
      src="/assets/menu-icon.svg"
      alt="Toggle menu"
      style={{ width: 24 }}
      role="img"
    />
  ),
  Search: () => (
    <img
      src="/assets/search-icon.svg"
      alt=""
      style={{ width: 16 }}
      role="presentation"
    />
  ),
  Add: () => (
    <img
      src="/assets/add-icon.svg"
      alt="Add"
      style={{ width: 20 }}
      role="presentation"
    />
  ),
  User: () => (
    <img
      src="/assets/user-icon.svg"
      alt="Sign in"
      style={{ width: 20 }}
      role="img"
    />
  ),
  Back: () => (
    <svg
      viewBox="0 0 24 24"
      height="24"
      width="24"
      focusable="false"
      style={{ display: "block", fill: "currentColor" }}
    >
      <path d="M21 11H6.83l3.58-3.59L9 6l-6 6 6 6 1.41-1.41L6.83 13H21z" />
    </svg>
  ),
};

// ================= NAVBAR COMPONENT =================
export default function Navbar({ toggleSidebar }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const { suggestions } = useSearchSuggestions(searchQuery);
  const searchRef = useRef(null);

  // ===== SEARCH HANDLERS =====
  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setSearchQuery("");
    setShowSuggestions(false);
    setMobileSearchOpen(false);
  };

  const handleSearchFocus = () => {
    if (searchQuery.length >= 2) setShowSuggestions(true);
  };

  const handleSearchBlur = () =>
    setTimeout(() => setShowSuggestions(false), 200);

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    navigate(`/search?q=${encodeURIComponent(suggestion)}`);
    setShowSuggestions(false);
    setMobileSearchOpen(false);
  };

  // ===== CREATE BUTTON HANDLER =====
  const handleCreateClick = () => {
    if (!user) {
      showToast("Please log in to upload content", "error");
      navigate("/login", { state: { from: location } });
    } else {
      navigate("/upload");
    }
  };

  const getCreateAriaLabel = () =>
    user ? "Upload video or short" : "Sign in to upload";

  // ===== ESCAPE KEY TO CLOSE MOBILE SEARCH =====
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setMobileSearchOpen(false);
        setShowSuggestions(false);
      }
    };
    if (mobileSearchOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileSearchOpen]);

  // ===== CLICK OUTSIDE TO CLOSE SUGGESTIONS =====
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      {/* Left: Menu + Logo */}
      <div className={`nav-left ${mobileSearchOpen ? "hidden" : ""}`}>
        <motion.button
          type="button"
          className="menu-icon"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.1)" }}
          whileTap={{ scale: 0.9 }}
        >
          <Icons.Menu />
        </motion.button>
        <motion.button
          type="button"
          className="youtube-logo"
          onClick={() => navigate("/")}
          aria-label="Go to home"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Icons.Youtube />
        </motion.button>
      </div>

      {/* Search */}
      <form
        className={`search-container ${mobileSearchOpen ? "active" : ""}`}
        onSubmit={handleSearch}
        role="search"
        ref={searchRef}
      >
        {mobileSearchOpen && (
          <motion.button
            type="button"
            className="nav-icon back-icon"
            onClick={() => setMobileSearchOpen(false)}
            aria-label="Back to navigation"
            style={{ marginRight: 8 }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <Icons.Back />
          </motion.button>
        )}
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            aria-label="Search videos"
          />
          <span className="search-icon-inside" aria-hidden="true">
            <Icons.Search />
          </span>
        </div>

        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              className="search-suggestions"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(s)}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {s}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Right: Search, Create, Profile/Login */}
      <div className={`nav-right ${mobileSearchOpen ? "hidden" : ""}`}>
        <motion.button
          type="button"
          className="nav-icon mobile-search-trigger"
          onClick={() => setMobileSearchOpen(true)}
          aria-label="Search"
          whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.1)" }}
          whileTap={{ scale: 0.9 }}
        >
          <Icons.Search />
        </motion.button>

        <motion.button
          type="button"
          className="create-btn"
          onClick={handleCreateClick}
          aria-label={getCreateAriaLabel()}
          whileHover={{ scale: 1.05, backgroundColor: "#e5e5e5" }}
          whileTap={{ scale: 0.95 }}
        >
          <Icons.Add aria-hidden="true" />
          <span>Create</span>
        </motion.button>

        {user ? (
          <motion.button
            type="button"
            className="nav-icon profile-icon-btn"
            onClick={() => navigate("/profile")}
            aria-label={`Go to ${user.name}'s profile`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <img
              src={user.avatar || "/default-avatar.png"}
              alt="Profile"
              className="profile-img"
              onError={(e) => (e.target.src = "/default-avatar.png")}
              loading="lazy"
            />
          </motion.button>
        ) : (
          <motion.button
            type="button"
            className="nav-icon"
            onClick={() => navigate("/login", { state: { from: location } })}
            aria-label="Sign in"
            whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.1)" }}
            whileTap={{ scale: 0.9 }}
          >
            <Icons.User aria-hidden="true" />
          </motion.button>
        )}
      </div>
    </nav>
  );
}
