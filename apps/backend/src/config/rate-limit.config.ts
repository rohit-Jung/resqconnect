import type { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

// get the client ip address from request
const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return req.socket.remoteAddress || 'unknown';
};

// Custom error response for rate limit exceeded
const createRateLimitErrorResponse = (req: Request, res: Response) => {
  //@ts-expect-error: req may not have rateLimit field
  const reset = req.rateLimit?.resetTime as unknown;
  const resetMs =
    reset instanceof Date
      ? reset.getTime()
      : typeof reset === 'number'
        ? reset
        : null;
  const retryAfter = resetMs ? Math.ceil((resetMs - Date.now()) / 1000) : 60;

  res.status(429).json({
    success: false,
    message: 'Too many requests, please try again later',
    retryAfter,
    timestamp: new Date().toISOString(),
  });
};

export const globalLimiter = rateLimit({
  windowMs: 1 * 1000, // 1 sec
  max: 10000, // max 10000 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // return rate limit info in `ratelimit-*` headers
  legacyHeaders: false, // disable `x-ratelimit-*` headers
  keyGenerator: getClientIp,
  handler: createRateLimitErrorResponse,
  skip: req => {
    // skip rate limiting for health check endpoints
    return (
      req.path === '/health' ||
      req.path === '/api/v1/health' ||
      req.path.includes('healthcheck')
    );
  },
  // store in memory for now
  store: undefined, // default memorystore
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 attempts per windowms
  message:
    'Too many authentication attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: createRateLimitErrorResponse,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// prevent brute force OTP
export const otpLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 5, // max 5 otp verification attempts per windowms
  message:
    'Too many OTP verification attempts, please try again after 30 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: createRateLimitErrorResponse,
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // max 3 password reset attempts per windowMs
  message: 'Too many password reset attempts, please try again after 1 hour',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: createRateLimitErrorResponse,
  skipSuccessfulRequests: true, // only count failed attempts
});

// prevent emergency request abuse
export const emergencyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // max 10 emergency requests per minute
  message: 'Too many emergency requests, please try again after 1 minute',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: createRateLimitErrorResponse,
});

// more lenient limits for get requests
export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // max 200 requests per windowMs
  message: 'Too many read requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: createRateLimitErrorResponse,
  skip: req => {
    // only apply to GET requests
    return req.method !== 'GET';
  },
});

// balanced limits for general api endpoints
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // max 30 requests per windowMs
  message: 'Too many API requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: createRateLimitErrorResponse,
});

// prevent upload abuse
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // max 10 uploads per hour
  message: 'Too many file uploads, please try again after 1 hour',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: createRateLimitErrorResponse,
});

// route fetching is high-frequency during live tracking
export const mapsRouteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1200, // max 120 route fetches per minute per IP (just for test 1200)
  message: 'Too many route requests, please try again shortly',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: createRateLimitErrorResponse,
});
