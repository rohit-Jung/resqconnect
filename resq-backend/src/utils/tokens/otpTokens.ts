import { generateToken, verifyToken } from "authenticator";

import { envConfig } from "@/config/env.config";

export const generateOtpToken = (phoneNumber: string) => {
  const formattedKey = phoneNumber + envConfig.otp_secret;
  return generateToken(formattedKey);
};

export const verifyOtpToken = (phoneNumber: string, otpNumber: string) => {
  const formattedKey = phoneNumber + envConfig.otp_secret;
  return verifyToken(formattedKey, otpNumber);
};
