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

organizationRouter
  .route('/')
  .get(validateAdmin, organizationController.getAllOrganizations);
organizationRouter
  .route('/profile')
  .get(validateOrg, organizationController.getOrgProfile);
organizationRouter
  .route('/profile')
  .patch(
    validateOrg,
    validateRequestBody(organizationValidations.updateOrgProfileSchema),
    organizationController.updateOrgProfile
  );

// dashboard analytics for organization
organizationRouter
  .route('/dashboard-analytics')
  .get(
    validateOrg,
    requireActiveOrganization,
    organizationController.getOrgDashboardAnalytics
  );

// public endpoint to list organizations for service provider registration
organizationRouter
  .route('/list')
  .get(organizationController.listOrganizationsPublic);

organizationRouter
  .route('/register')
  .post(
    validateAdmin,
    authLimiter,
    validateRequestBody(organizationValidations.registerOrganizationSchema),
    organizationController.registerOrganization
  );

organizationRouter
  .route('/login')
  .post(
    authLimiter,
    validateRequestBody(organizationValidations.loginOrganizationSchema),
    organizationController.loginOrganization
  );

organizationRouter
  .route('/verify')
  .post(
    otpLimiter,
    validateRequestBody(organizationValidations.verifyOrgOTPSchema),
    organizationController.verifyOrgOTP
  );

organizationRouter
  .route('/resend-otp')
  .post(
    otpLimiter,
    validateRequestBody(
      organizationValidations.resendOrganizationVerificationOTPSchema
    ),
    organizationController.resendOrganizationVerificationOTP
  );

//service provider management routes
organizationRouter
  .route('/service-providers')
  .get(
    validateOrg,
    requireActiveOrganization,
    organizationController.getOrgServiceProviders
  )
  .post(
    validateOrg,
    requireActiveOrganization,
    enforceProviderCountLimit,
    validateRequestBody(
      organizationValidations.registerOrgServiceProviderSchema
    ),
    organizationController.registerOrgServiceProvider
  );

organizationRouter
  .route('/service-providers/:id')
  .get(
    validateOrg,
    requireActiveOrganization,
    organizationController.getOrgServiceProviderById
  )
  .patch(
    validateOrg,
    requireActiveOrganization,
    validateRequestBody(organizationValidations.updateOrgServiceProviderSchema),
    organizationController.updateOrgServiceProvider
  )
  .delete(
    validateOrg,
    requireActiveOrganization,
    organizationController.deleteOrgServiceProvider
  );

organizationRouter
  .route('/service-providers/:id/verify')
  .post(
    validateOrg,
    requireActiveOrganization,
    organizationController.verifyOrgServiceProvider
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
  .get(validateAdmin, organizationController.getOrganizationById)
  .delete(validateAdmin, organizationController.deleteOrganization)
  .put(validateAdmin, organizationController.updateOrganization);

export default organizationRouter;
