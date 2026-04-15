import { Router } from 'express';

import { UserRoles } from '@/constants';
import {
  createSubscriptionPlan,
  deleteSubscriptionPlan,
  getActiveSubscription,
  getPaymentHistory,
  getPaymentStatus,
  getSubscriptionPlans,
  initiateSubscription,
  paymentCallback,
  updateSubscriptionPlan,
} from '@/controllers/payment.controller';
import { validateOrg, validateRoleAuth } from '@/middlewares/auth.middleware';

const paymentRouter = Router();

// Public routes
paymentRouter.route('/plans').get(getSubscriptionPlans);
paymentRouter.route('/callback').get(paymentCallback);

// Protected routes (requires organization authentication)
paymentRouter.route('/subscribe').post(validateOrg, initiateSubscription);
paymentRouter.route('/status/:paymentId').get(validateOrg, getPaymentStatus);
paymentRouter.route('/history').get(validateOrg, getPaymentHistory);
paymentRouter.route('/subscription').get(validateOrg, getActiveSubscription);

// Admin routes for plan management
const validateAdmin = validateRoleAuth([UserRoles.ADMIN]);
paymentRouter.route('/plans').post(validateAdmin, createSubscriptionPlan);
paymentRouter.route('/plans/:id').put(validateAdmin, updateSubscriptionPlan);
paymentRouter.route('/plans/:id').delete(validateAdmin, deleteSubscriptionPlan);

export default paymentRouter;
