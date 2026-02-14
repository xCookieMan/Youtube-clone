import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import "./index.css";

// Layout
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";

// Public Pages
import Home from "./pages/public/Home";
import VideoPlayer from "./pages/public/VideoPlayer";
import Shorts from "./pages/public/Shorts";
import ShortsPlayer from "./pages/public/ShortsPlayer";
import SearchResults from "./pages/public/SearchResults";
import CategoryPage from "./pages/public/CategoryPage";
import Settings from "./pages/public/Settings";
import Help from "./pages/public/Help";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import OTPVerification from "./pages/auth/OTPVerification";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// User Pages
import Profile from "./pages/user/Profile";
import Subscriptions from "./pages/user/Subscriptions";
import History from "./pages/user/History";
import LikedVideos from "./pages/user/LikedVideos";
import WatchLater from "./pages/user/WatchLater";
import UploadVideo from "./pages/user/UploadVideo";
import YourVideos from "./pages/user/YourVideos";
import Playlists from "./pages/user/Playlists";
import ChannelCreate from "./pages/user/ChannelCreate";

// ================= PROTECTED ROUTES =================
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="loading">Loading...</div>;
  return user ? (
    children
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

// ================= MAIN APP =================
function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const location = useLocation();

  // Handle window resize for mobile layout
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close sidebar on mobile navigation
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location, isMobile]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <ToastProvider>
      <Navbar toggleSidebar={toggleSidebar} />

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="sidebar-overlay open"
          onClick={toggleSidebar}
          role="presentation"
        />
      )}

      <div className="main-layout">
        <div className={`sidebar-wrapper ${sidebarOpen ? "open" : ""}`}>
          <Sidebar isExpanded={!isMobile || sidebarOpen} />
        </div>

        <div className="content">
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/" element={<Home />} />
            <Route path="/shorts" element={<Shorts />} />
            <Route path="/short/:id" element={<ShortsPlayer />} />
            <Route path="/watch/:id" element={<VideoPlayer />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/category/:category" element={<CategoryPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />

            {/* AUTH ROUTES */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<OTPVerification />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* USER ROUTES */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:id"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/channel/:id"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscriptions"
              element={
                <ProtectedRoute>
                  <Subscriptions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/liked"
              element={
                <ProtectedRoute>
                  <LikedVideos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/watch-later"
              element={
                <ProtectedRoute>
                  <WatchLater />
                </ProtectedRoute>
              }
            />
            <Route
              path="/playlists"
              element={
                <ProtectedRoute>
                  <Playlists />
                </ProtectedRoute>
              }
            />
            <Route
              path="/channel/create"
              element={
                <ProtectedRoute>
                  <ChannelCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <UploadVideo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/videos"
              element={
                <ProtectedRoute>
                  <YourVideos />
                </ProtectedRoute>
              }
            />

            {/* CATCH-ALL */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </ToastProvider>
  );
}

export default App;
