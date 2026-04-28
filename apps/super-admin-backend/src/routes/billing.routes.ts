import { asyncHandler } from '@repo/utils/api';

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

export const billingRouter = Router();

billingRouter.post('/webhooks/khalti', asyncHandler(khaltiWebhook));

billingRouter.post(
  '/my/checkout',
  requireOrgAuth,
  asyncHandler(initiateCheckoutMy)
);
billingRouter.get(
  '/my/subscription',
  requireOrgAuth,
  asyncHandler(getMyActiveSubscription)
);
billingRouter.get('/my/payments', requireOrgAuth, asyncHandler(listMyPayments));
billingRouter.get(
  '/my/payments/:id',
  requireOrgAuth,
  asyncHandler(getMyPaymentById)
);
billingRouter.post(
  '/my/payments/verify',
  requireOrgAuth,
  asyncHandler(verifyMyPayment)
);
billingRouter.get(
  '/my/payments/by-pidx/:pidx',
  requireOrgAuth,
  asyncHandler(getMyPaymentByPidx)
);

billingRouter.use(requireAdminAuth);

billingRouter.post('/checkout', asyncHandler(initiateCheckout));

billingRouter.get('/payments', asyncHandler(listPaymentsAdmin));
billingRouter.get('/payments/:id', asyncHandler(getPaymentByIdAdmin));
