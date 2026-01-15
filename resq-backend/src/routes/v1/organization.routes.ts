import { Router } from 'express';

import { UserRoles } from '@/constants';
import {
  deleteOrgServiceProvider,
  deleteOrganization,
  getAllOrganizations,
  getOrgProfile,
  getOrgServiceProviderById,
  // Service Provider Management
  getOrgServiceProviders,
  getOrganizationById,
  listOrganizationsPublic,
  loginOrganization,
  registerOrgServiceProvider,
  registerOrganization,
  updateOrgServiceProvider,
  updateOrganization,
  verifyOrgOTP,
  verifyOrgServiceProvider,
} from '@/controllers/organization.controller';
import { validateOrg, validateRoleAuth } from '@/middlewares/auth.middleware';

const organizationRouter = Router();
const validateAdmin = validateRoleAuth([UserRoles.ADMIN]);

organizationRouter.route('/profile').get(validateOrg, getOrgProfile);

// Public endpoint to list organizations for service provider registration
organizationRouter.route('/list').get(listOrganizationsPublic);

organizationRouter
  .route('/register')
  .post(registerOrganization)
  .get(validateAdmin, getAllOrganizations);

organizationRouter.route('/login').post(loginOrganization);

organizationRouter.route('/verify').post(verifyOrgOTP);

// ============== Service Provider Management Routes ==============
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

organizationRouter
  .route('/:id')
  .get(getOrganizationById)
  .delete(validateAdmin, deleteOrganization)
  .put(validateAdmin, updateOrganization);

export default organizationRouter;
