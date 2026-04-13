import { Router } from 'express';

import { uploadDocuments } from '@/config/cloudinary.config';
import {
  authLimiter,
  otpLimiter,
  passwordResetLimiter,
} from '@/config/rate-limit.config';
import {
  changeProviderPassword,
  deleteServiceProvider,
  forgotServiceProviderPassword,
  getDocumentStatus,
  getNearbyProviders,
  getServiceProvider,
  getServiceProviderProfile,
  loginServiceProvider,
  logoutServiceProvider,
  registerServiceProvider,
  resetServiceProviderPassword,
  updateServiceProvider,
  updateServiceProviderLocation,
  updateServiceProviderStatus,
  uploadVerificationDocuments,
  verifyServiceProvider,
} from '@/controllers/service-provider.controller';
import {
  validateRequestBody,
  validateServiceProvider,
} from '@/middlewares/auth.middleware';
import { loginServiceProviderSchema } from '@/models';
import {
  updateServiceProviderSchema,
  updateServiceProviderLocationSchema,
  updateServiceProviderStatusSchema,
  forgotServiceProviderPasswordSchema,
  resetServiceProviderPasswordSchema,
  changeProviderPasswordSchema,
  verifyServiceProviderSchema,
} from '@/validations/service-provider.validations';

const serviceProviderRouter = Router();

// Public routes
serviceProviderRouter.post('/register', authLimiter, registerServiceProvider);
serviceProviderRouter.post(
  '/login',
  authLimiter,
  validateRequestBody(loginServiceProviderSchema),
  loginServiceProvider
);
serviceProviderRouter.post(
  '/verify',
  otpLimiter,
  validateRequestBody(verifyServiceProviderSchema),
  verifyServiceProvider
);
serviceProviderRouter.post(
  '/forgot-password',
  passwordResetLimiter,
  validateRequestBody(forgotServiceProviderPasswordSchema),
  forgotServiceProviderPassword
);
serviceProviderRouter.post(
  '/reset-password',
  passwordResetLimiter,
  validateRequestBody(resetServiceProviderPasswordSchema),
  resetServiceProviderPassword
);
serviceProviderRouter.get('/nearby', getNearbyProviders);

// Protected routes
serviceProviderRouter.use(validateServiceProvider);
serviceProviderRouter.post('/logout', logoutServiceProvider);
serviceProviderRouter.get('/profile', getServiceProviderProfile);
serviceProviderRouter.patch(
  '/update',
  validateRequestBody(updateServiceProviderSchema),
  updateServiceProvider
);
serviceProviderRouter.patch(
  '/update-location',
  validateRequestBody(updateServiceProviderLocationSchema),
  updateServiceProviderLocation
);
serviceProviderRouter.delete('/delete', deleteServiceProvider);
serviceProviderRouter.post(
  '/change-password',
  validateRequestBody(changeProviderPasswordSchema),
  changeProviderPassword
);

// Document verification routes (provider uploads documents)
serviceProviderRouter.post(
  '/documents',
  uploadDocuments,
  uploadVerificationDocuments
);
serviceProviderRouter.get('/documents/status', getDocumentStatus);

serviceProviderRouter.get('/:id', getServiceProvider);
serviceProviderRouter.patch(
  '/status',
  validateRequestBody(updateServiceProviderStatusSchema),
  updateServiceProviderStatus
);

export default serviceProviderRouter;
