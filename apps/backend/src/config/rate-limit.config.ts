import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Get the client IP address from request
 * Handles proxies and X-Forwarded-For headers
 */
const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
};

/**
 * Custom error response for rate limit exceeded
 */
const createRateLimitErrorResponse = (req: Request, res: Response) => {
  const retryAfter = req.rateLimit?.resetTime
    ? Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    : 60;

  res.status(429).json({
    success: false,
    message: 'Too many requests, please try again later',
    retryAfter,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Production-grade global rate limiter
 * Applied to all routes for baseline DDoS protection
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  keyGenerator: getClientIp,
  handler: createRateLimitErrorResponse,
  skip: (req) => {
    // Skip rate limiting for health check endpoints
    return req.path === '/health' || req.path === '/api/v1/health';
  },
  // Store in memory for single instance, consider Redis for production with multiple instances
  store: undefined, // Uses default MemoryStore
});

/**
 * Authentication endpoints rate limiter
 * Strict limits on register/login to prevent brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 attempts per windowMs
  message: 'Too many authentication attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: createRateLimitErrorResponse,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

/**
 * OTP verification rate limiter
 * Prevents brute force OTP attacks
 */
export const otpLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 5, // Max 5 OTP verification attempts per windowMs
  message: 'Too many OTP verification attempts, please try again after 30 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: createRateLimitErrorResponse,
});

/**
 * Password reset rate limiter
 * Prevents password reset abuse
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 password reset attempts per windowMs
  message: 'Too many password reset attempts, please try again after 1 hour',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: createRateLimitErrorResponse,
  skipSuccessfulRequests: true, // Only count failed attempts
});

/**
 * Emergency request rate limiter
 * Prevents abuse of emergency request creation
 */
export const emergencyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Max 10 emergency requests per minute
  message: 'Too many emergency requests, please try again after 1 minute',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: createRateLimitErrorResponse,
});

/**
 * Read-only endpoints rate limiter
 * More lenient limits for GET requests
 */
export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Max 200 requests per windowMs
  message: 'Too many read requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: createRateLimitErrorResponse,
  skip: (req) => {
    // Only apply to GET requests
    return req.method !== 'GET';
  },
});

/**
 * API endpoint rate limiter
 * Balanced limits for general API endpoints
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Max 30 requests per windowMs
  message: 'Too many API requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: createRateLimitErrorResponse,
});

/**
 * File upload rate limiter
 * Prevents upload abuse
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 uploads per hour
  message: 'Too many file uploads, please try again after 1 hour',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: createRateLimitErrorResponse,
});
