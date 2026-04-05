import { Router } from 'express';
import { validateBody, validateRequest } from 'twilio';

import { uploadDocuments } from '@/config/cloudinary.config';
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

const serviceProviderRouter = Router();

// Public routes
serviceProviderRouter.post('/register', registerServiceProvider);
serviceProviderRouter.post(
  '/login',
  validateRequestBody(loginServiceProviderSchema),
  loginServiceProvider
);
serviceProviderRouter.post('/verify', verifyServiceProvider);
serviceProviderRouter.post('/forgot-password', forgotServiceProviderPassword);
serviceProviderRouter.post('/reset-password', resetServiceProviderPassword);
serviceProviderRouter.get('/nearby', getNearbyProviders);

// Protected routes
serviceProviderRouter.use(validateServiceProvider);
serviceProviderRouter.post('/logout', logoutServiceProvider);
serviceProviderRouter.get('/profile', getServiceProviderProfile);
serviceProviderRouter.patch('/update', updateServiceProvider);
serviceProviderRouter.patch('/update-location', updateServiceProviderLocation);
serviceProviderRouter.delete('/delete', deleteServiceProvider);
serviceProviderRouter.post('/change-password', changeProviderPassword);

// Document verification routes (provider uploads documents)
serviceProviderRouter.post(
  '/documents',
  uploadDocuments,
  uploadVerificationDocuments
);
serviceProviderRouter.get('/documents/status', getDocumentStatus);

serviceProviderRouter.get('/:id', getServiceProvider);
serviceProviderRouter.patch('/status', updateServiceProviderStatus);

export default serviceProviderRouter;
