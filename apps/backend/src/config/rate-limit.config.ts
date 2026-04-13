import rateLimit from 'express-rate-limit';

/**
 * Global rate limiter for all API requests
 * Applied to all endpoints by default
 * Limit: 100 requests per 15 minutes
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message:
    'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health check endpoint
    return req.path === '/api/v1/health' || req.path === '/health';
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * Limit: 5 requests per 15 minutes
 * Protects against brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message:
    'Too many login/registration attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests, including successful ones
});

/**
 * Strict rate limiter for password reset endpoints
 * Limit: 3 requests per 1 hour
 * Prevents abuse of password reset functionality
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 requests per windowMs
  message:
    'Too many password reset attempts, please try again after 1 hour',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * Moderate rate limiter for API endpoints that modify data
 * Limit: 30 requests per 15 minutes
 * Used for POST, PUT, DELETE operations
 */
export const createUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 requests per windowMs
  message:
    'Too many requests to create/update resources, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for emergency requests
 * Limit: 10 requests per 1 minute
 * Allows legitimate emergency requests while preventing spam
 */
export const emergencyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message:
    'Too many emergency requests, please try again in a moment',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * Lenient rate limiter for read-only endpoints
 * Limit: 200 requests per 15 minutes
 * Used for GET endpoints that don't modify data
 */
export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message:
    'Too many read requests, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Extremely strict rate limiter for OTP verification
 * Limit: 5 requests per 30 minutes
 * Prevents brute force OTP guessing
 */
export const otpLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 5, // limit each IP to 5 attempts per windowMs
  message:
    'Too many OTP verification attempts, please try again after 30 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});
