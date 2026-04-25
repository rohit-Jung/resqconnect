import { Router } from 'express';

import { UserRoles } from '@/constants';
import emergencyResponseController from '@/controllers/emergency-response.controller';
import {
  validateRoleAuth,
  validateServiceProvider,
} from '@/middlewares/auth.middleware';

const emergencyResponseRouter = Router();

emergencyResponseRouter
  .route('/')
  // .get(validateRoleAuth(["user"]), getEmergencyResponse)
  .post(
    validateRoleAuth([UserRoles.USER]),
    emergencyResponseController.createEmergencyResponse
  );

emergencyResponseRouter
  .route('/provider-responses')
  .get(
    validateServiceProvider,
    emergencyResponseController.getProviderResponses
  );

emergencyResponseRouter
  .route('/:id')
  .get(emergencyResponseController.getEmergencyResponse)
  .put(emergencyResponseController.updateEmergencyResponse)
  .delete(
    validateRoleAuth([UserRoles.ADMIN]),
    emergencyResponseController.deleteEmergencyResponse
  );

export default emergencyResponseRouter;
