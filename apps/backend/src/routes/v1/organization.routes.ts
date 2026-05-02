import { organizationValidations } from '@repo/types/validations';

import { Router } from 'express';

import { authLimiter, otpLimiter } from '@/config';
import { UserRoles } from '@/constants';
import organizationController from '@/controllers/organization.controller';
import serviceProviderController from '@/controllers/service-provider.controller';
import {
  validateOrg,
  validateRequestBody,
  validateRoleAuth,
} from '@/middlewares/auth.middleware';
import {
  enforceProviderCountLimit,
  requireAnalyticsEnabled,
} from '@/middlewares/entitlements.guard';
import { requireActiveOrganization } from '@/middlewares/org-status.guard';

const organizationRouter = Router();
const validateAdmin = validateRoleAuth([UserRoles.ADMIN]);

organizationRouter.route('/').get(validateAdmin, organizationController.getAll);
organizationRouter
  .route('/profile')
  .get(validateOrg, organizationController.profile);
organizationRouter
  .route('/profile')
  .patch(
    validateOrg,
    validateRequestBody(organizationValidations.updateOrgProfileSchema),
    organizationController.updateProfile
  );

// dashboard analytics for organization
organizationRouter
  .route('/dashboard-analytics')
  .get(
    validateOrg,
    requireActiveOrganization,
    organizationController.dashboardAnalytics
  );

// public endpoint to list organizations for service provider registration
organizationRouter.route('/list').get(organizationController.listPublic);

organizationRouter
  .route('/register')
  .post(
    validateAdmin,
    authLimiter,
    validateRequestBody(organizationValidations.registerOrganizationSchema),
    organizationController.register
  );

organizationRouter
  .route('/login')
  .post(
    authLimiter,
    validateRequestBody(organizationValidations.loginOrganizationSchema),
    organizationController.login
  );

organizationRouter
  .route('/verify')
  .post(
    otpLimiter,
    validateRequestBody(organizationValidations.verifyOrgOTPSchema),
    organizationController.verifyOTP
  );

organizationRouter
  .route('/resend-otp')
  .post(
    otpLimiter,
    validateRequestBody(
      organizationValidations.resendOrganizationVerificationOTPSchema
    ),
    organizationController.resendVerificationOTP
  );

//service provider management routes
organizationRouter
  .route('/service-providers')
  .get(
    validateOrg,
    requireActiveOrganization,
    organizationController.getProviders
  )
  .post(
    validateOrg,
    requireActiveOrganization,
    enforceProviderCountLimit,
    validateRequestBody(
      organizationValidations.registerOrgServiceProviderSchema
    ),
    organizationController.registerProvider
  );

organizationRouter
  .route('/service-providers/:id')
  .get(
    validateOrg,
    requireActiveOrganization,
    organizationController.getProviderById
  )
  .patch(
    validateOrg,
    requireActiveOrganization,
    validateRequestBody(organizationValidations.updateOrgServiceProviderSchema),
    organizationController.updateProvider
  )
  .delete(
    validateOrg,
    requireActiveOrganization,
    organizationController.deleteProvider
  );

organizationRouter
  .route('/service-providers/:id/verify')
  .post(
    validateOrg,
    requireActiveOrganization,
    organizationController.verifyProvider
  );

// document verification routes (organization admin verifies provider docs)
organizationRouter
  .route('/verifications/pending')
  .get(
    validateOrg,
    requireActiveOrganization,
    serviceProviderController.getPendingVerifications
  );

organizationRouter
  .route('/verifications/:providerId')
  .get(
    validateOrg,
    requireActiveOrganization,
    serviceProviderController.getProviderDocuments
  );

organizationRouter
  .route('/verifications/:providerId/verify')
  .post(
    validateOrg,
    requireActiveOrganization,
    serviceProviderController.verifyProviderDocuments
  );

organizationRouter
  .route('/:id')
  .get(validateAdmin, organizationController.getById)
  .delete(validateAdmin, organizationController.remove)
  .put(validateAdmin, organizationController.update);

export default organizationRouter;
