import type { Request } from 'express';
import rateLimit from 'express-rate-limit';

import {
  RESTRICTIVE_DEFAULT_ENTITLEMENTS,
  getLatestOrgEntitlements,
} from '@/services/entitlements.service';
import { redis } from '@/services/redis.service';

// org-tiered rate limiter enforced from entitlements snapshot. uses redis so it works across instances.
// non-org requests fall back to a low cap.
export const orgTierApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: async (req: Request) => {
    const u = req.user;
    if (u?.role === 'organization' && u.id) {
      const latest = await getLatestOrgEntitlements(u.id);
      const tier =
        latest?.entitlements.api_rate_limit_tier ??
        RESTRICTIVE_DEFAULT_ENTITLEMENTS.api_rate_limit_tier;
      return Math.max(1, tier || 1);
    }
    return 10;
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => {
    const u = req.user;
    if (u?.role === 'organization' && u.id) return `org:${u.id}`;
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string')
      return forwarded.split(',')[0]?.trim() || 'unknown';
    return req.socket.remoteAddress || 'unknown';
  },

  // redis-backed store (express-rate-limit v8 store interface).
  store: {
    async increment(key: string) {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.pexpire(key, 15 * 60 * 1000);
      }
      const ttl = await redis.pttl(key);
      return {
        totalHits: current,
        resetTime: new Date(Date.now() + Math.max(0, ttl)),
      };
    },
    async decrement(key: string) {
      try {
        await redis.decr(key);
      } catch {
        // ignore
      }
    },
    async resetKey(key: string) {
      await redis.del(key);
    },
  },
  handler: (req, res) => {
    //@ts-expect-error: req may not have rateLimit field
    const reset = req.rateLimit?.resetTime;
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
  },
  skip: req => {
    // route tracking requests are handled by a dedicated limiter
    return req.path === '/api/v1/maps/optimal-route';
  },
});
