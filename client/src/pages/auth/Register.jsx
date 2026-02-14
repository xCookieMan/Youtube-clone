import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { getApiBase } from "../../lib/api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const showToast = useToast();
  const nameInputRef = useRef(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      showToast("All fields are required", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      showToast("Please enter a valid email address", "error");
      return;
    }

    if (password.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }

    setLoading(true);

    try {
      const regRes = await fetch(`${getApiBase()}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password,
        }),
      });

      const regData = await regRes.json();
      if (!regRes.ok) {
        throw new Error(regData?.message || "Registration failed");
      }

      // ✅ FIXED: Store email temporarily and redirect to correct route
      localStorage.setItem("tempUserEmail", trimmedEmail);
      navigate("/verify-otp", {
        state: { email: trimmedEmail },
      });
    } catch (err) {
      console.error("Registration error:", err);
      showToast(err.message || "Something went wrong", "error");
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
          Create Account
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: "16px" }}>
            <input
              ref={nameInputRef}
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <input
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
              placeholder="Password (min 6 chars)"
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
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p
          className="auth-link"
          style={{ textAlign: "center", marginTop: "24px" }}
        >
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
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
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
