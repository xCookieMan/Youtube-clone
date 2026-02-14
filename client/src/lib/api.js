export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const getApiBase = () => API_BASE;

/* ================= AUTH ================= */
export const login = (email, password) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const register = (name, email, password) =>
  request("/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

export const verifyOTP = (email, otp) =>
  request("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });

export const forgotPassword = (email) =>
  request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const resetPassword = (email, otp, newPassword) =>
  request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, otp, newPassword }),
  });

/* ================= AUTH TOKEN ================= */
const getAuthToken = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;

  try {
    const user = JSON.parse(userStr);
    return user?.token || null;
  } catch {
    console.warn("Failed to parse user from localStorage");
    return null;
  }
};

/* ================= AUTH HEADER ================= */
export const getAuthHeader = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/* ================= CORE REQUEST ================= */
export const request = async (url, options = {}) => {
  const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
  const token = getAuthToken();

  const headers = {
    ...(options.body instanceof FormData
      ? {} // FormData → browser handles headers automatically
      : { "Content-Type": "application/json" }),
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const config = {
    method: "GET",
    credentials: "include",
    ...options,
    headers,
  };

  const res = await fetch(fullUrl, config);

  if (res.status === 204) return null;

  if (!res.ok) {
    let message = res.statusText || "Request failed";
    try {
      const err = await res.json();
      message = err.message || err.error || message;
    } catch {}
    throw new Error(message);
  }

  return await res.json();
};

/* ================= SEARCH ================= */
export const searchVideos = (query, limit = 10, options = {}) => {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });
  return request(`/videos/search?${params.toString()}`, {
    method: "GET",
    signal: options.signal,
  });
};

/* ================= VIDEOS ================= */
export const fetchVideos = () => request("/videos");
export const fetchVideoById = (id) => request(`/videos/${id}`);
export const fetchShorts = () => request("/videos/shorts");
export const fetchShortById = (id) => request(`/videos/${id}`);

/* ================= USER CONTENT ================= */
export const getUserVideos = () => request("/videos/me");
export const getUserShorts = () => request("/videos/shorts/me");
export const fetchUserVideos = getUserVideos; // alias

/* ================= INTERACTIONS ================= */
export const likeVideo = (videoId) =>
  request(`/videos/${videoId}/like`, { method: "POST" });

export const dislikeVideo = (videoId) =>
  request(`/videos/${videoId}/dislike`, { method: "POST" });

export const addComment = (videoId, text) =>
  request(`/videos/${videoId}/comment`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });

export const replyToComment = (videoId, commentId, text) =>
  request(`/videos/${videoId}/comments/${commentId}/reply`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });

export const subscribeChannel = (channelId) =>
  request(`/channels/${channelId}/subscribe`, { method: "POST" });

export const fetchLikedVideos = () => request("/videos/liked");

export const addToWatchLater = (videoId) =>
  request("/videos/watch-later", {
    method: "POST",
    body: JSON.stringify({ videoId }),
  });

export const removeFromWatchLater = (videoId) =>
  request(`/videos/watch-later/${videoId}`, { method: "DELETE" });

export const fetchWatchLater = () => request("/videos/watch-later");

export const fetchWatchLaterIds = () => request("/videos/watch-later/ids");

export const addToHistory = (videoId, progress, duration) =>
  request("/videos/history", {
    method: "POST",
    body: JSON.stringify({ videoId, progress, duration }),
  });

export const fetchHistory = () => request("/videos/history");

/* ================= UPLOAD ================= */
export const uploadVideo = (formData) =>
  request("/videos/upload", { method: "POST", body: formData });

/* ================= FAVORITES ================= */
export const toggleFavoriteImage = (imageId) =>
  request(`/favorites/${imageId}`, { method: "POST" });

export const getFavoriteImages = () => request("/favorites");

/* ================= PROFILE ================= */
export const updateProfile = (data) =>
  request("/users/profile", { method: "PATCH", body: JSON.stringify(data) });

export const updateAvatar = (formData) =>
  request("/users/avatar", { method: "PATCH", body: formData });

/* ================= CATEGORY ================= */
export const fetchVideosByCategory = (category) =>
  category ? request(`/videos/category/${category}`) : request("/videos");

export const fetchVideosByChannel = (channelId) =>
  request(`/videos/channel/${channelId}`);

/* ================= AUTH ================= */
export const registerUser = (userData) =>
  request("/auth/register", { method: "POST", body: JSON.stringify(userData) });

export const loginUser = (credentials) =>
  request("/auth/login", { method: "POST", body: JSON.stringify(credentials) });

export const verifyOtp = (email, otp) =>
  request("/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });

/* ================= CHANNELS ================= */
export const fetchUserChannel = () => request("/channels");
export const fetchChannelById = (id) => request(`/channels/${id}`);
export const getUserSubscriptions = () => request("/channels/subscriptions");

export const updateChannelName = (name) =>
  request("/channels/name", { method: "PATCH", body: JSON.stringify({ name }) });

export const deleteChannel = () =>
  request("/channels", { method: "DELETE" });

export const deleteAccount = () =>
  request("/users/me", { method: "DELETE" });

export const fetchSubscribedChannels = async () => {
  try {
    const data = await getUserSubscriptions();
    if (Array.isArray(data)) return data;
    if (data?.channels && Array.isArray(data.channels)) return data.channels;
    return [];
  } catch (err) {
    console.error("Failed to fetch subscriptions", err);
    return [];
  }
};

/* ================= PLAYLISTS ================= */
export const createPlaylist = (name, isPrivate) =>
  request("/playlists", {
    method: "POST",
    body: JSON.stringify({ name, isPrivate }),
  });

export const fetchUserPlaylists = () => request("/playlists/me");

export const addVideoToPlaylist = (playlistId, videoId) =>
  request(`/playlists/${playlistId}/videos`, {
    method: "POST",
    body: JSON.stringify({ videoId }),
  });

export const removeVideoFromPlaylist = (playlistId, videoId) =>
  request(`/playlists/${playlistId}/videos/${videoId}`, {
    method: "DELETE",
  });
