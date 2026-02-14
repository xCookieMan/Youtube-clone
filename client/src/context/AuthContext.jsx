import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Assign default role if missing
  const assignRole = useCallback((userData) => {
    if (!userData || typeof userData !== "object") return userData;
    if (userData.role && ["admin", "user"].includes(userData.role))
      return userData;
    return { ...userData, role: "user" };
  }, []);

  // Initialize user from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      if (!parsed.token || !parsed._id) throw new Error("Invalid auth data");
      setUser(assignRole(parsed));
    } catch {
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [assignRole]);

  // Login user and persist
  const login = async (authResponse) => {
    if (!authResponse?.token || !authResponse?.user)
      return { success: false, error: "Invalid authentication response" };

    try {
      const userData = { ...authResponse.user, token: authResponse.token };
      const withRole = assignRole(userData);
      localStorage.setItem("user", JSON.stringify(withRole));
      setUser(withRole);
      return { success: true, user: withRole };
    } catch (err) {
      return { success: false, error: err.message || "Login failed" };
    }
  };

  // Logout user and redirect to login
  const logout = useCallback(() => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  // Update user details
  const updateUser = (updatedUser) => {
    if (!updatedUser) return;
    const withRole = assignRole(updatedUser);
    localStorage.setItem("user", JSON.stringify(withRole));
    setUser(withRole);
  };

  const isAdmin = user?.role === "admin";

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ user, isAdmin, login, logout, updateUser, loading }),
    [user, isAdmin, login, logout, updateUser, loading]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
