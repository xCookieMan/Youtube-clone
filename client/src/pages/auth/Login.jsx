import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { API_BASE } from "../../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToast();
  const emailInputRef = useRef(null);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      showToast("Please enter both email and password", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      showToast("Please enter a valid email address", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: trimmedEmail,
          password: trimmedPassword,
        }),
      });

      const data = await res.json();

      if (res.ok && data?.token && data?.user) {
        // ✅ FIXED: Pass full response object to login
        await login(data);
        showToast("Signed in successfully!", "success");
        navigate(from, { replace: true });
        return;
      }

      if (res.status === 401) {
        if (data?.code === "EMAIL_NOT_VERIFIED") {
          showToast("Please verify your email with OTP.", "info");
          // ✅ FIXED: Include email in state for OTP page
          navigate("/verify-otp", {
            state: { email: trimmedEmail },
          });
          return;
        }
        showToast(data?.message || "Invalid email or password", "error");
        return;
      }

      showToast(data?.message || "Login failed. Please try again.", "error");
    } catch (err) {
      console.error("Login error:", err);
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-container"
      style={{
        background:
          "radial-gradient(circle at 10% 20%, rgba(204, 0, 0, 0.1) 0%, transparent 20%), radial-gradient(circle at 90% 80%, rgba(204, 0, 0, 0.1) 0%, transparent 20%)",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
      }}
    >
      {/* YouTube Logo */}
      <div
        onClick={() => navigate("/")}
        style={{
          position: "absolute",
          top: "24px",
          left: "24px",
          cursor: "pointer",
        }}
      >
        <img
          src="/assets/youtube-clone.png"
          alt="YouTube Clone"
          style={{ height: "28px" }}
        />
      </div>

      {/* Auth Card */}
      <div
        className="auth-card"
        style={{
          maxWidth: "400px",
          width: "100%",
          padding: "32px",
          borderRadius: "12px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
          backgroundColor: "var(--card-bg, white)",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: "24px",
            color: "var(--text-color, #0f0f0f)",
          }}
        >
          Sign in
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: "16px" }}>
            <input
              ref={emailInputRef}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              style={{
                padding: "12px",
                width: "100%",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "16px",
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: "24px" }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              style={{
                padding: "12px",
                width: "100%",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "16px",
              }}
            />
          </div>

          <button
            type="submit"
            className="auth-btn"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: loading ? "#ccc" : "#cc0000",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <span
            onClick={() => navigate("/forgot-password")}
            style={{
              color: "#065fd4",
              fontSize: "14px",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Forgot password?
          </span>
        </div>

        <p
          className="auth-link"
          style={{ textAlign: "center", marginTop: "24px" }}
        >
          Don’t have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            disabled={loading}
            className="link-btn"
            style={{
              background: "none",
              border: "none",
              color: "#cc0000",
              cursor: "pointer",
              fontSize: "16px",
              textDecoration: "underline",
            }}
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}
