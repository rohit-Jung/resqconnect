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
    emergencyRequestController.getForUser
  )
  .post(
    emergencyLimiter,
    validateRoleAuth([UserRoles.USER]),
    validateRequestBody(emergencyRequestValidations.CreateNewRequestSchema),
    requireAuthenticatedUser,
    emergencyRequestController.create
  );

emergencyRequestRouter.get(
  '/recent',
  validateRoleAuth([UserRoles.USER]),
  emergencyRequestController.getRecent
);

emergencyRequestRouter.patch(
  '/:id/cancel',
  validateRoleAuth([UserRoles.USER]),
  emergencyRequestController.cancel
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
  emergencyRequestController.accept
);

emergencyRequestRouter.patch(
  '/:id/reject',
  validateServiceProvider,
  emergencyRequestController.reject
);

emergencyRequestRouter.patch(
  '/:id/complete',
  validateServiceProvider,
  emergencyRequestController.complete
);

emergencyRequestRouter.get(
  '/user/history',
  validateRoleAuth([UserRoles.USER]),
  validateQueryParams(routeParamsValidations.getHistoryQuerySchema),
  requireAuthenticatedUser,
  emergencyRequestController.getUserHistory
);

emergencyRequestRouter.get(
  '/provider/history',
  validateServiceProvider,
  validateQueryParams(routeParamsValidations.getHistoryQuerySchema),
  emergencyRequestController.getProviderHistory
);

emergencyRequestRouter
  .route('/:id')
  .get(emergencyRequestController.getById)
  .put(emergencyRequestController.update)
  .delete(
    validateRoleAuth([UserRoles.ADMIN]),
    emergencyRequestController.remove
  );

export default emergencyRequestRouter;
