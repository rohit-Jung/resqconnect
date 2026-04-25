import { Router } from 'express';

import { getDashboardAnalytics } from '@/controllers/admin.controller';
import incidentBridgeController from '@/controllers/incident-bridge.controller';
import internalController from '@/controllers/internal.controller';
import { requireInternalAuth } from '@/middlewares/internal-auth.middleware';

const internalRouter = Router();

internalRouter.use(requireInternalAuth);

internalRouter.get('/health', internalController.health);

internalRouter.get('/metrics', internalController.metrics);

internalRouter.get('/org-snapshots', internalController.orgSnapshots);

internalRouter.post('/orgs/provision', internalController.provisionOrg);

// Control plane pushes lifecycle status changes (approve/suspend/reactivate)
internalRouter.post('/orgs/:orgId/status', internalController.updateOrgStatus);

// Control plane pushes entitlements snapshots (versioned).
internalRouter.post(
  '/orgs/:orgId/entitlements',
  internalController.storeOrgEntitlementsSnapshot
);

// Sanitized compliance index for control plane ingestion.
// Returns aggregated counts only (no IDs/emails/PHI).
internalRouter.get('/sanitized-index', internalController.sanitizedIndex);

// Admin dashboard analytics for the control plane.
// Uses internal auth instead of admin JWT.
internalRouter.get('/admin-dashboard-analytics', getDashboardAnalytics);

// Platform <-> Silo incident bridge endpoints (requires internal auth)
internalRouter.post(
  '/incidents/incoming',
  incidentBridgeController.siloIncomingIncident
);

internalRouter.post(
  '/incidents/:platformIncidentId/update',
  incidentBridgeController.platformIncidentUpdate
);

export default internalRouter;
