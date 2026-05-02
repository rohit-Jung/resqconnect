import type { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import type { Options } from 'express-rate-limit';

type CreateLimiterOptions = {
  windowMs: number;
  max: number;
  message?: string;
  skip?: Options['skip'];
  keyGenerator?: Options['keyGenerator'];
  extra?: Partial<Options>;
};

// Custom error response for rate limit exceeded
export const rateLimitHandler = (
  req: Request,
  res: Response,
  _next: NextFunction,
  options: Options
) => {
  const reset = req.rateLimit?.resetTime;

  const retryAfter =
    reset instanceof Date
      ? Math.ceil((reset.getTime() - Date.now()) / 1000)
      : 60;

  res.status(429).json({
    success: false,
    message:
      typeof options.message === 'string'
        ? options.message
        : 'Too many requests, please try again later',
    retryAfter,
    timestamp: new Date().toISOString(),
  });
};

const baseConfig: Partial<Options> = {
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
};

export const createLimiter = ({
  windowMs,
  max,
  message,
  skip,
  keyGenerator = getClientIp,
  extra = {},
}: CreateLimiterOptions) => {
  return rateLimit({
    ...baseConfig,
    windowMs,
    max,
    message,
    skip,
    keyGenerator,
    ...extra,
  });
};

// get the client ip address from request
const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return req.socket.remoteAddress || 'unknown';
};

export const globalLimiter = createLimiter({
  windowMs: 1000,
  max: 10000,
  message: 'Too many requests globally',
  skip: req =>
    req.path === '/health' ||
    req.path === '/api/v1/health' ||
    req.path.includes('healthcheck'),
});

export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts',
});

// prevent brute force OTP
export const otpLimiter = createLimiter({
  windowMs: 30 * 60 * 1000, // 30 min
  max: 5,
  message: 'Too many OTP attempts',
});

export const passwordResetLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 4,
  message: 'Too many password reset attempts',
  extra: {
    skipSuccessfulRequests: true,
  },
});

// prevent emergency request abuse
export const emergencyLimiter = createLimiter({
  windowMs: 1 * 60 * 1000, // 1min
  max: 10,
  message: 'Service requested too many times.',
  extra: {
    skipSuccessfulRequests: true,
  },
});

// more lenient limits for get requests
export const readLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many read requests',
  skip: req => req.method !== 'GET',
});

// balanced limits for general api endpoints
export const apiLimiter = rateLimit({
  windowMs: 1 * 1000,
  max: 1000, // 1000 request a second
  message: 'Too many API Request',
});

// prevent upload abuse
export const uploadLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many uploads',
});

// route fetching is high-frequency during live tracking
export const mapsRouteLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 1200, // max 120 route fetches per minute per IP (just for test 1200)
  message: 'Too many route requests, please try again shortly',
});
