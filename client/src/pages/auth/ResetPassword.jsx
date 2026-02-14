import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { forgotPassword, resetPassword } from "../../lib/api";

export default function ResetPassword() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [resendDisabled, setResendDisabled] = useState(true);
  const [resendTimer, setResendTimer] = useState(30);
  
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToast();

  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      showToast("Email missing. Please start over.", "error");
      navigate("/forgot-password");
    }
  }, [email, navigate, showToast]);

  useEffect(() => {
    if (resendTimer === 0) {
      setResendDisabled(false);
      return;
    }
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleResend = async () => {
    if (!email) return showToast("Email missing", "error");
    
    try {
      await forgotPassword(email);
      showToast("Reset code resent successfully", "success");
      setResendDisabled(true);
      setResendTimer(30);
    } catch (err) {
      console.error("Resend OTP error:", err);
      showToast(err.message || "Failed to resend OTP", "error");
    }
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input
    if (element.value && element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && e.target.previousSibling) {
      e.target.previousSibling.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      showToast("Please enter the complete 6-digit code", "error");
      return;
    }

    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email, otpString, newPassword);
      showToast("Password reset successfully! Please login.", "success");
      navigate("/login");
    } catch (err) {
      console.error("Reset Password Error:", err);
      showToast(err.message || "Failed to reset password", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!email) return null;

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
          Create New Password
        </h2>
        <p
          style={{
            textAlign: "center",
            marginBottom: "24px",
            color: "#606060",
            fontSize: "14px",
          }}
        >
          Enter the code sent to <strong>{email}</strong> and your new password.
        </p>

        <form onSubmit={handleSubmit}>
          {/* OTP Inputs */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "24px",
            }}
          >
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={data}
                onChange={(e) => handleOtpChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onFocus={(e) => e.target.select()}
                style={{
                  width: "40px",
                  height: "48px",
                  fontSize: "20px",
                  textAlign: "center",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  outline: "none",
                }}
              />
            ))}
          </div>

          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <p style={{ color: "#606060", fontSize: "14px" }}>
              Didn't receive the code?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendDisabled}
                style={{
                  background: "none",
                  border: "none",
                  color: resendDisabled ? "#909090" : "#065fd4",
                  cursor: resendDisabled ? "default" : "pointer",
                  fontWeight: "500",
                  textDecoration: resendDisabled ? "none" : "underline",
                }}
              >
                {resendDisabled ? `Resend in ${resendTimer}s` : "Resend"}
              </button>
            </p>
          </div>

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
