export const getOtpMessage = (otpCode: string) => {
  return `Welcome to firstResQ. Your Login OTP Code is ${otpCode}`;
};

export const phoneRegex = /^[0-9]{10}$/;


// Default location (Kathmandu, Nepal) if user doesn't provide location
export const DEFAULT_LATITUDE = 27.7172;
export const DEFAULT_LONGITUDE = 85.324;

export const adminEmails = ['test@admin.com'];
export const MUST_CONNECT_TIMEOUT_MS = 15000; // 15 seconds
export const H3_RESOLUTION = 8; // ~0.46 km² per cell
export const REQUEST_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
export const INITIAL_SEARCH_RADIUS = 1; // k-ring radius

export const INITIAL_K_RING_RADIUS = 1;
export const EXPANDED_K_RING_RADIUS = 2;
export const MAX_PROVIDERS_TO_BROADCAST = 10;
export const AVERAGE_SPEED_KM_PER_MIN = 0.5; // 30 km/h

export const OUTBOX_POLL_INTERVAL = 1000; // 1 second
export const TIMEOUT_CHECK_INTERVAL = 10000; // 10 seconds
export const DISCONNECT_CHECK_INTERVAL = 5000; // 5 seconds
export const MAX_SEARCH_RADIUS = 5;

export * from './enums.constants';
