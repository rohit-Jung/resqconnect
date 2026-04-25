import { Router } from 'express';

import {
  getMyActiveSubscription,
  getMyPaymentById,
  getMyPaymentByPidx,
  getPaymentByIdAdmin,
  initiateCheckout,
  initiateCheckoutMy,
  khaltiWebhook,
  listMyPayments,
  listPaymentsAdmin,
  verifyMyPayment,
} from '@/controllers/billing.controller';
import { requireAdminAuth } from '@/middlewares/admin-auth.middleware';
import { requireOrgAuth } from '@/middlewares/org-auth.middleware';

// Billing endpoints from control plane.
export const billingRouter = Router();

billingRouter.post('/webhooks/khalti', khaltiWebhook);

// Organization-scoped billing endpoints.
billingRouter.post('/my/checkout', requireOrgAuth, initiateCheckoutMy);
billingRouter.get('/my/subscription', requireOrgAuth, getMyActiveSubscription);
billingRouter.get('/my/payments', requireOrgAuth, listMyPayments);
billingRouter.get('/my/payments/:id', requireOrgAuth, getMyPaymentById);
billingRouter.post('/my/payments/verify', requireOrgAuth, verifyMyPayment);
billingRouter.get(
  '/my/payments/by-pidx/:pidx',
  requireOrgAuth,
  getMyPaymentByPidx
);

// Other billing endpoints are admin-only.
billingRouter.use(requireAdminAuth);

billingRouter.post('/checkout', initiateCheckout);

// Admin payment history endpoints.
billingRouter.get('/payments', listPaymentsAdmin);
billingRouter.get('/payments/:id', getPaymentByIdAdmin);
