import { Router } from 'express';

import {
  changeProviderPassword,
  deleteServiceProvider,
  forgotServiceProviderPassword,
  getNearbyProviders,
  getServiceProvider,
  getServiceProviderProfile,
  loginServiceProvider,
  logoutServiceProvider,
  registerServiceProvider,
  resetServiceProviderPassword,
  updateServiceProvider,
  updateServiceProviderStatus,
  verifyServiceProvider,
} from '@/controllers/service-provider.controller';
import { validateServiceProvider } from '@/middlewares/auth.middleware';

const serviceProviderRouter = Router();

// Public routes
serviceProviderRouter.post('/register', registerServiceProvider);
serviceProviderRouter.post('/login', loginServiceProvider);
serviceProviderRouter.post('/verify', verifyServiceProvider);
serviceProviderRouter.post('/forgot-password', forgotServiceProviderPassword);
serviceProviderRouter.post('/reset-password', resetServiceProviderPassword);
serviceProviderRouter.get('/nearby', getNearbyProviders);

// Protected routes
serviceProviderRouter.use(validateServiceProvider);
serviceProviderRouter.post('/logout', logoutServiceProvider);
serviceProviderRouter.get('/profile', getServiceProviderProfile);
serviceProviderRouter.patch('/update', updateServiceProvider);
serviceProviderRouter.delete('/delete', deleteServiceProvider);
serviceProviderRouter.post('/change-password', changeProviderPassword);
serviceProviderRouter.get('/:id', getServiceProvider);
serviceProviderRouter.patch('/status', updateServiceProviderStatus);

export default serviceProviderRouter;
