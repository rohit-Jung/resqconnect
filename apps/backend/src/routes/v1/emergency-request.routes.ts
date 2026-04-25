import { emergencyRequestValidations } from '@repo/types/validations';
import { routeParamsValidations } from '@repo/types/validations';

import { Router } from 'express';

import { emergencyLimiter } from '@/config/rate-limit.config';
import { UserRoles } from '@/constants/enums.constants';
import emergencyRequestController from '@/controllers/emergency-request.controller';
import {
  requireAuthenticatedUser,
  validateQueryParams,
  validateRequestBody,
  validateRoleAuth,
  validateServiceProvider,
} from '@/middlewares/auth.middleware';

const emergencyRequestRouter = Router();

emergencyRequestRouter
  .route('/')
  .get(
    validateRoleAuth([UserRoles.USER]),
    requireAuthenticatedUser,
    emergencyRequestController.getUsersEmergencyRequests
  )
  .post(
    emergencyLimiter,
    validateRoleAuth([UserRoles.USER]),
    validateRequestBody(emergencyRequestValidations.CreateNewRequestSchema),
    requireAuthenticatedUser,
    emergencyRequestController.createEmergencyRequest
  );

emergencyRequestRouter.get(
  '/recent',
  validateRoleAuth([UserRoles.USER]),
  emergencyRequestController.getRecentEmergencyRequests
);

emergencyRequestRouter.patch(
  '/:id/cancel',
  validateRoleAuth([UserRoles.USER]),
  emergencyRequestController.cancelEmergencyRequest
);

emergencyRequestRouter.patch(
  '/:id/confirm-arrival',
  validateRoleAuth([UserRoles.USER]),
  emergencyRequestController.confirmProviderArrival
);

emergencyRequestRouter.patch(
  '/:id/confirm-arrived',
  validateServiceProvider,
  emergencyRequestController.providerConfirmedArrival
);

emergencyRequestRouter.patch(
  '/:id/accept',
  validateServiceProvider,
  emergencyRequestController.acceptEmergencyRequest
);

emergencyRequestRouter.patch(
  '/:id/reject',
  validateServiceProvider,
  emergencyRequestController.rejectEmergencyRequest
);

emergencyRequestRouter.patch(
  '/:id/complete',
  validateServiceProvider,
  emergencyRequestController.completeEmergencyRequest
);

emergencyRequestRouter.get(
  '/user/history',
  validateRoleAuth([UserRoles.USER]),
  validateQueryParams(routeParamsValidations.getHistoryQuerySchema),
  requireAuthenticatedUser,
  emergencyRequestController.getUserEmergencyHistory
);

emergencyRequestRouter.get(
  '/provider/history',
  validateServiceProvider,
  validateQueryParams(routeParamsValidations.getHistoryQuerySchema),
  emergencyRequestController.getProviderEmergencyHistory
);

emergencyRequestRouter
  .route('/:id')
  .get(emergencyRequestController.getEmergencyRequest)
  .put(emergencyRequestController.updateEmergencyRequest)
  .delete(
    validateRoleAuth([UserRoles.ADMIN]),
    emergencyRequestController.deleteEmergencyRequest
  );

export default emergencyRequestRouter;
