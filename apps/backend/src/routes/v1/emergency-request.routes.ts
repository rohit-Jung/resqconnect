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
  getProviderEmergencyHistory,
  getRecentEmergencyRequests,
  getUserEmergencyHistory,
  getUsersEmergencyRequests,
  providerConfirmedArrival,
  rejectEmergencyRequest,
  updateEmergencyRequest,
} from '@/controllers/emergency-request.controller';
import {
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

emergencyRequestRouter.patch(
  '/:id/confirm-arrived',
  validateServiceProvider,
  providerConfirmedArrival
);

emergencyRequestRouter.patch(
  '/:id/accept',
  validateServiceProvider,
  acceptEmergencyRequest
);

emergencyRequestRouter.patch(
  '/:id/reject',
  validateServiceProvider,
  rejectEmergencyRequest
);

emergencyRequestRouter.patch(
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

emergencyRequestRouter.get(
  '/provider/history',
  validateServiceProvider,
  validateQueryParams(getHistoryQuerySchema),
  getProviderEmergencyHistory
);

emergencyRequestRouter
  .route('/:id')
  .get(getEmergencyRequest)
  .put(updateEmergencyRequest)
  .delete(validateRoleAuth([UserRoles.ADMIN]), deleteEmergencyRequest);

export default emergencyRequestRouter;
