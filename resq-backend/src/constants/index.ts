export const getOtpMessage = (otpCode: string) => {
  return `Welcome to firstResQ. Your Login OTP Code is ${otpCode}`;
};

export const phoneRegex = /^[0-9]{10}$/;


export const adminEmails = ['test@admin.com'];
export const MUST_CONNECT_TIMEOUT_MS = 15000; // 15 seconds
export const H3_RESOLUTION = 8; // ~0.46 km² per cell
export const REQUEST_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
export const INITIAL_SEARCH_RADIUS = 1; // k-ring radius

export * from './enums.constants';
