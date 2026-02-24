import { Router } from 'express';

import { UserRoles } from '@/constants/enums.constants';
import {
  acceptEmergencyRequest,
  cancelEmergencyRequest,
  completeEmergencyRequest,
  confirmProviderArrival,
  createEmergencyRequest,
  deleteEmergencyRequest,
  getEmergencyRequest,
  getRecentEmergencyRequests,
  getUsersEmergencyRequests,
  rejectEmergencyRequest,
  updateEmergencyRequest,
} from '@/controllers/emergency-request.controller';
import {
  validateRoleAuth,
  validateServiceProvider,
} from '@/middlewares/auth.middleware';

const emergencyRequestRouter = Router();

emergencyRequestRouter
  .route('/')
  .get(validateRoleAuth([UserRoles.USER]), getUsersEmergencyRequests)
  .post(validateRoleAuth([UserRoles.USER]), createEmergencyRequest);

emergencyRequestRouter.get(
  '/recent',
  validateRoleAuth([UserRoles.USER]),
  getRecentEmergencyRequests
);

// Cancel emergency request (user only)
emergencyRequestRouter.patch(
  '/:id/cancel',
  validateRoleAuth([UserRoles.USER]),
  cancelEmergencyRequest
);

// Confirm provider arrival (user only)
emergencyRequestRouter.patch(
  '/:id/confirm-arrival',
  validateRoleAuth([UserRoles.USER]),
  confirmProviderArrival
);

// Provider actions
emergencyRequestRouter.post(
  '/:id/accept',
  validateServiceProvider,
  acceptEmergencyRequest
);

emergencyRequestRouter.post(
  '/:id/reject',
  validateServiceProvider,
  rejectEmergencyRequest
);

emergencyRequestRouter.post(
  '/:id/complete',
  validateServiceProvider,
  completeEmergencyRequest
);

emergencyRequestRouter
  .route('/:id')
  .get(getEmergencyRequest)
  .put(updateEmergencyRequest)
  .delete(validateRoleAuth([UserRoles.ADMIN]), deleteEmergencyRequest);

export default emergencyRequestRouter;
