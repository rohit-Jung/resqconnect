import { Router } from 'express';

import { UserRoles } from '@/constants';
import {
  deleteOrgServiceProvider,
  deleteOrganization,
  getAllOrganizations,
  getOrgDashboardAnalytics,
  getOrgProfile,
  getOrgServiceProviderById,
  // Service Provider Management
  getOrgServiceProviders,
  getOrganizationById,
  listOrganizationsPublic,
  loginOrganization,
  registerOrgServiceProvider,
  registerOrganization,
  updateOrgProfile,
  updateOrgServiceProvider,
  updateOrganization,
  verifyOrgOTP,
  verifyOrgServiceProvider,
} from '@/controllers/organization.controller';
import {
  getPendingVerifications,
  getProviderDocuments,
  verifyProviderDocuments,
} from '@/controllers/service-provider.controller';
import { validateOrg, validateRoleAuth } from '@/middlewares/auth.middleware';

const organizationRouter = Router();
const validateAdmin = validateRoleAuth([UserRoles.ADMIN]);

organizationRouter.route('/').get(validateAdmin, getAllOrganizations);
organizationRouter.route('/profile').get(validateOrg, getOrgProfile);
organizationRouter.route('/profile').patch(validateOrg, updateOrgProfile);

// Dashboard analytics for organization
organizationRouter
  .route('/dashboard-analytics')
  .get(validateOrg, getOrgDashboardAnalytics);

// Public endpoint to list organizations for service provider registration
organizationRouter.route('/list').get(listOrganizationsPublic);

organizationRouter.route('/register').post(registerOrganization);

organizationRouter.route('/login').post(loginOrganization);

organizationRouter.route('/verify').post(verifyOrgOTP);

//Service Provider Management Routes
organizationRouter
  .route('/service-providers')
  .get(validateOrg, getOrgServiceProviders)
  .post(validateOrg, registerOrgServiceProvider);

organizationRouter
  .route('/service-providers/:id')
  .get(validateOrg, getOrgServiceProviderById)
  .patch(validateOrg, updateOrgServiceProvider)
  .delete(validateOrg, deleteOrgServiceProvider);

organizationRouter
  .route('/service-providers/:id/verify')
  .post(validateOrg, verifyOrgServiceProvider);

// Document verification routes (organization admin verifies provider docs)
organizationRouter
  .route('/verifications/pending')
  .get(validateOrg, getPendingVerifications);

organizationRouter
  .route('/verifications/:providerId')
  .get(validateOrg, getProviderDocuments);

organizationRouter
  .route('/verifications/:providerId/verify')
  .post(validateOrg, verifyProviderDocuments);

organizationRouter
  .route('/:id')
  .get(validateAdmin, getOrganizationById)
  .delete(validateAdmin, deleteOrganization)
  .put(validateAdmin, updateOrganization);

export default organizationRouter;
