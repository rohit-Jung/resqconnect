import cors from 'cors';
import express from 'express';

import { adminRouter } from '@/routes/admin.routes';
import { authRouter } from '@/routes/auth.routes';
import { billingRouter } from '@/routes/billing.routes';
import { dashboardRouter } from '@/routes/dashboard.routes';
import { entitlementsRouter } from '@/routes/entitlements.routes';
import { healthRouter } from '@/routes/health.routes';
import { lookupRouter } from '@/routes/lookup.routes';
import { orgsRouter } from '@/routes/orgs.routes';
import { plansRouter } from '@/routes/plans.routes';
import { buildErrorCauseChain, unwrapPgError } from '@/utils/pg-error';

const app = express();

const allowedorigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['*'];

app.use(
  cors({
    origin: allowedorigins,
    credentials: true,
  })
);

app.use(express.json());

// Surface the real Postgres error that Drizzle wraps (helps debug “Failed query”).
app.use((req, _res, next) => {
  (req as any)._reqId =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  next();
});

app.use('/auth', authRouter);
app.use('/health', healthRouter);
app.use('/admin', adminRouter);
app.use('/billing', billingRouter);
app.use('/plans', plansRouter);
app.use('/orgs', orgsRouter);
app.use('/dashboard', dashboardRouter);
app.use('/lookup', lookupRouter);
app.use('/', entitlementsRouter);

// Last: centralized error handler.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: any, res: any, _next: any) => {
  const reqId = req?._reqId;
  const pg = unwrapPgError(err);

  console.error('Unhandled error', {
    reqId,
    method: req?.method,
    path: req?.originalUrl,
    pg,
    causes: buildErrorCauseChain(err),
  });

  res.status(500).json({ ok: false, error: 'Internal server error', reqId });
});

export { app };
