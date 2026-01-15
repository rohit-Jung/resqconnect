import { Router } from 'express';

import {
  createEmergencyResponse,
  deleteEmergencyResponse,
  getEmergencyResponse,
  getProviderResponses,
  updateEmergencyResponse,
} from '@/controllers/emergency-response.controller';
import {
  validateRoleAuth,
  validateServiceProvider,
} from '@/middlewares/auth.middleware';
import { UserRoles } from '@/constants';

const emergencyResponseRouter = Router();

emergencyResponseRouter
  .route('/')
  // .get(validateRoleAuth(["user"]), getEmergencyResponse)
  .post(validateRoleAuth([UserRoles.USER]), createEmergencyResponse);

emergencyResponseRouter
  .route('/provider-responses')
  .get(validateServiceProvider, getProviderResponses);

emergencyResponseRouter
  .route('/:id')
  .get(getEmergencyResponse)
  .put(updateEmergencyResponse)
  .delete(validateRoleAuth([UserRoles.ADMIN]), deleteEmergencyResponse);

export default emergencyResponseRouter;
