import { Router } from 'express';

import {
  createEmergencyRequest,
  deleteEmergencyRequest,
  getEmergencyRequest,
  getRecentEmergencyRequests,
  getUsersEmergencyRequests,
  updateEmergencyRequest,
} from '@/controllers/emergency-request.controller';
import { validateRoleAuth } from '@/middlewares/auth.middleware';
import { UserRoles } from "@/constants/enums.constants"

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
emergencyRequestRouter
  .route('/:id')
  .get(getEmergencyRequest)
  .put(updateEmergencyRequest)
  .delete(validateRoleAuth(['admin']), deleteEmergencyRequest);

export default emergencyRequestRouter;
