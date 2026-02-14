import { timingSafeEqual, createHash } from "crypto";

// In-memory store for OTPs (use Redis in production)
const otpStore = new Map();

/* ================= HELPERS ================= */
const hashOTP = (otp) => createHash("sha256").update(otp).digest();

/* ================= STORE OTP ================= */
export const storeOTP = async (email, otp, expiresAt, userData = null) => {
  otpStore.set(email, {
    otpHash: hashOTP(otp),
    expiresAt: new Date(expiresAt),
    userData,
    attempts: 0, // brute-force protection
  });

  // Automatically remove OTP after expiry
  const delay = Math.max(expiresAt - Date.now(), 0);
  setTimeout(() => {
    const record = otpStore.get(email);
    if (record && record.expiresAt <= new Date()) {
      otpStore.delete(email);
    }
  }, delay);
};

/* ================= VERIFY OTP ================= */
export const verifyOTP = async (email, otp) => {
  const record = otpStore.get(email);

  if (!record) return { isValid: false };

  // Check expiration
  if (record.expiresAt <= new Date()) {
    otpStore.delete(email);
    return { isValid: false };
  }

  // Max attempts (anti brute-force)
  record.attempts += 1;
  if (record.attempts > 5) {
    otpStore.delete(email);
    return { isValid: false };
  }

  const inputHash = hashOTP(otp);

  // Prevent length-based attacks
  if (inputHash.length !== record.otpHash.length) {
    return { isValid: false };
  }

  const isValid = timingSafeEqual(record.otpHash, inputHash);

  if (isValid) {
    const userData = record.userData;
    otpStore.delete(email); // remove after successful verification
    return { isValid: true, userData };
  }

  return { isValid: false };
};

/* ================= GET OTP DATA ================= */
export const getOTPData = (email) => {
  return otpStore.get(email);
};
