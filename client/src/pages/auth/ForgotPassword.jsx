import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { forgotPassword } from "../../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const showToast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!email.trim()) {
      showToast("Please enter your email", "error");
      return;
    }

    setLoading(true);

    try {
      await forgotPassword(email.trim());
      showToast("Reset code sent to your email", "success");
      navigate("/reset-password", { state: { email: email.trim() } });
    } catch (err) {
      console.error("Forgot Password Error:", err);
      // Show specific message from backend or fallback
      showToast(err.message, "error");
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
            marginBottom: "16px",
            color: "var(--text-color, #0f0f0f)",
          }}
        >
          Reset Password
        </h2>
        <p
          style={{
            textAlign: "center",
            marginBottom: "24px",
            color: "#606060",
            fontSize: "14px",
          }}
        >
          Enter your email to receive a password reset code.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: "24px" }}>
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
            {loading ? "Sending..." : "Send Reset Code"}
          </button>
        </form>

        <p
          className="auth-link"
          style={{ textAlign: "center", marginTop: "24px" }}
        >
          Remember your password?{" "}
          <span
            onClick={() => navigate("/login")}
            style={{
              color: "#cc0000",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}
