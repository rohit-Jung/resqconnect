import { ApiResponse } from '@repo/utils/api';

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
import { silosRouter } from '@/routes/silos.routes';
import { tenantsRouter } from '@/routes/tenants.routes';
import { usersRouter } from '@/routes/users.routes';
import { AppError } from '@/utils/errors';

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['*'];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Health
app.use('/health', healthRouter);

// Auth
app.use('/auth', authRouter);

// Admin dashboard
app.use('/admin', adminRouter);
app.use('/dashboard', dashboardRouter);

// Orgs
app.use('/orgs', orgsRouter);

// Users
app.use('/users', usersRouter);

// Plans
app.use('/plans', plansRouter);

// Billing
app.use('/billing', billingRouter);

// Lookup
app.use('/lookup', lookupRouter);

// Silo registry & sync
app.use('/internal/silos', silosRouter);
app.use('/internal/tenants', tenantsRouter);

// Entitlements (mounted at root since routes have /orgs/:id prefix)
app.use('/', entitlementsRouter);

// 404
app.use((_req, res) => {
  res.status(404).json(new ApiResponse(404, 'Not found', null));
});

// Error handler
app.use((err: unknown, req: any, res: any, _next: any) => {
  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json(new ApiResponse(err.statusCode, err.message, null));
  }
  console.error('Unhandled error', err);
  res.status(500).json(new ApiResponse(500, 'Internal server error', null));
});

export { app };
