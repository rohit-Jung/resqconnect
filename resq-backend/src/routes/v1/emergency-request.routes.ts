import { Router } from 'express';

import { UserRoles } from '@/constants/enums.constants';
import {
  cancelEmergencyRequest,
  createEmergencyRequest,
  deleteEmergencyRequest,
  getEmergencyRequest,
  getRecentEmergencyRequests,
  getUsersEmergencyRequests,
  updateEmergencyRequest,
} from '@/controllers/emergency-request.controller';
import { validateRoleAuth } from '@/middlewares/auth.middleware';

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

emergencyRequestRouter
  .route('/:id')
  .get(getEmergencyRequest)
  .put(updateEmergencyRequest)
  .delete(validateRoleAuth([UserRoles.ADMIN]), deleteEmergencyRequest);

export default emergencyRequestRouter;
