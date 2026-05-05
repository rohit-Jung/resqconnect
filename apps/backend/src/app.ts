import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

import {
  configureSecurityMiddlewares,
  corsOptions,
  envConfig,
  globalLimiter,
} from '@/config';
import { auditLogMiddleware } from '@/middlewares/audit-log.middleware';
import { orgTierApiLimiter } from '@/middlewares/entitlements-rate-limit.middleware';
import { requireMfa } from '@/middlewares/mfa.middleware';
import { notFoundMiddleware } from '@/middlewares/not-found.middleware';
import { phiMaskMiddleware } from '@/middlewares/phi-mask.middleware';
import { populateUserFromToken } from '@/middlewares/populate-user.middleware';
import { enforceRbac } from '@/middlewares/rbac.middleware';
import { enforceSessionTimeout } from '@/middlewares/session-timeout.middleware';
import { v1Router } from '@/routes';

const app = express();

// security middlewares
configureSecurityMiddlewares(app);

// CORS middleware - must be after security middlewares
app.use(cors(corsOptions));

// body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// populate req.user when a token is present.
app.use(populateUserFromToken);

// compliance middlewares (sector-config driven)
app.use(auditLogMiddleware);
app.use(phiMaskMiddleware);

// global rate limiting to all routes (baseline DDoS protection)
app.use(globalLimiter);

// org limiter only on orgs
if (envConfig.mode == 'silo') {
  // enforce org-tiered api limits (15m window).
  // uses redis so  works across instances.
  app.use(orgTierApiLimiter);
}

// enforce compliance constraints after auth middleware populates req.user.
// these middlewares are safe no-ops for unauthenticated requests.
app.use(enforceSessionTimeout);
app.use(requireMfa);
app.use(enforceRbac);

// api routes
app.use('/api/v1', v1Router);

// not found middleware (must be last)
app.use(notFoundMiddleware);

export { app };
