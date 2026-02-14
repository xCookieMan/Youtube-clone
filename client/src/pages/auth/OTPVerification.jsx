import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getApiBase } from "../../lib/api";

export default function OTPVerification() {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToast();
  const { login } = useAuth(); // ✅ Use login instead of updateChannelStatus
  const otpRefs = useRef([]);
  const hasSubmitted = useRef(false);

  // ✅ Only handle user email verification (no channel mode)
  const email =
    location.state?.email || localStorage.getItem("tempUserEmail") || "";

  useEffect(() => {
    otpRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (!email) {
      showToast("Email missing. Please register again.", "error");
      navigate("/register", { replace: true });
    }
  }, [email, navigate, showToast]);

  useEffect(() => {
    const otpString = otp.join("");
    if (otpString.length === 6 && !loading && !hasSubmitted.current) {
      hasSubmitted.current = true;
      handleSubmit();
    }
  }, [otp, loading]);

  useEffect(() => {
    if (!resendDisabled) return;
    if (resendTimer === 0) {
      setResendDisabled(false);
      return;
    }
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendDisabled, resendTimer]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    hasSubmitted.current = false;
    if (value && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (!email) return showToast("Email missing", "error");
    try {
      const res = await fetch(`${getApiBase()}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resend OTP");
      showToast("OTP resent successfully", "success");
      setResendDisabled(true);
      setResendTimer(30);
    } catch (err) {
      console.error("Resend OTP error:", err);
      showToast(err.message || "Network error", "error");
    }
  };

  const handleSubmit = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) return;

    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpString }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid OTP");

      // ✅ FIXED: Login user after OTP verification
      localStorage.removeItem("tempUserEmail");
      await login(data); // Pass full response to login
      showToast("Email verified successfully!", "success");

      // ✅ Redirect to channel creation if no channel exists
      navigate("/channel/create", { replace: true });
    } catch (err) {
      console.error("OTP verification error:", err);
      showToast(
        err.message || "Verification failed. Please try again.",
        "error"
      );
      setOtp(Array(6).fill(""));
      otpRefs.current[0]?.focus();
      hasSubmitted.current = false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: "500px" }}>
        <h2>Verify Your Email</h2>
        <p>
          Enter the 6-digit code sent to <strong>{email}</strong>
        </p>

        <form
          onSubmit={(e) => e.preventDefault()}
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "5px",
            marginTop: "20px",
          }}
        >
          {otp.map((val, i) => (
            <input
              key={i}
              type="text"
              maxLength={1}
              value={val}
              onChange={(e) => handleChange(e, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              ref={(el) => (otpRefs.current[i] = el)}
              disabled={loading}
              style={{
                width: "40px",
                height: "40px",
                textAlign: "center",
                fontSize: "18px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
          ))}
        </form>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || otp.join("").length !== 6}
          style={{
            width: "100%",
            padding: "10px",
            background: otp.join("").length === 6 ? "#cc0000" : "#999",
            color: "white",
            border: "none",
            borderRadius: "4px",
            marginTop: "20px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendDisabled || loading}
          style={{
            width: "100%",
            padding: "10px",
            background: resendDisabled ? "#ccc" : "#666",
            color: "white",
            border: "none",
            borderRadius: "4px",
            marginTop: "10px",
            cursor: resendDisabled || loading ? "not-allowed" : "pointer",
          }}
        >
          {resendDisabled ? `Resend in ${resendTimer}s` : "Resend OTP"}
        </button>
      </div>
    </div>
  );
}
