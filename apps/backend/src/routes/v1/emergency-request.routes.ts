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
  getUserEmergencyHistory,
  getUsersEmergencyRequests,
  rejectEmergencyRequest,
  updateEmergencyRequest,
} from '@/controllers/emergency-request.controller';
import {
  requireAuthenticatedProvider,
  requireAuthenticatedUser,
  validateQueryParams,
  validateRequestBody,
  validateRoleAuth,
  validateServiceProvider,
} from '@/middlewares/auth.middleware';
import { CreateNewRequestSchema } from '@/validations/emergency-request';
import { getHistoryQuerySchema } from '@/validations/route-params.validations';

const emergencyRequestRouter = Router();

emergencyRequestRouter
  .route('/')
  .get(
    validateRoleAuth([UserRoles.USER]),
    requireAuthenticatedUser,
    getUsersEmergencyRequests
  )
  .post(
    validateRoleAuth([UserRoles.USER]),
    validateRequestBody(CreateNewRequestSchema),
    requireAuthenticatedUser,
    createEmergencyRequest
  );

emergencyRequestRouter.get(
  '/recent',
  validateRoleAuth([UserRoles.USER]),
  getRecentEmergencyRequests
);

emergencyRequestRouter.patch(
  '/:id/cancel',
  validateRoleAuth([UserRoles.USER]),
  cancelEmergencyRequest
);

emergencyRequestRouter.patch(
  '/:id/confirm-arrival',
  validateRoleAuth([UserRoles.USER]),
  confirmProviderArrival
);

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

emergencyRequestRouter.get(
  '/user/history',
  validateRoleAuth([UserRoles.USER]),
  validateQueryParams(getHistoryQuerySchema),
  requireAuthenticatedUser,
  getUserEmergencyHistory
);

emergencyRequestRouter
  .route('/:id')
  .get(getEmergencyRequest)
  .put(updateEmergencyRequest)
  .delete(validateRoleAuth([UserRoles.ADMIN]), deleteEmergencyRequest);

export default emergencyRequestRouter;
