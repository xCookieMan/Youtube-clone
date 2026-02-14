import { randomInt } from "crypto";

/**
 * Generates a secure 6-digit numeric OTP (One-Time Password)
 * @returns {string} 6-digit OTP (e.g., "390729")
 */
export const generateOTP = () => {
  // randomInt(min, max) is exclusive of max, so 1000000 ensures 999999 is included
  const otp = randomInt(100000, 1000000);
  return otp.toString().padStart(6, "0"); // ensures leading zeros are preserved
};
