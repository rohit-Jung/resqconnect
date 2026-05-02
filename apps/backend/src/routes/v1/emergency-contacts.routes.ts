import express from 'express';

import { UserRoles } from '@/constants';
import emergencyContactsController from '@/controllers/emergency-contacts.controller';
import { validateRoleAuth } from '@/middlewares/auth.middleware';

const emergencyContactsRouter = express.Router();

emergencyContactsRouter
  .route('/')
  .post(validateRoleAuth([UserRoles.USER]), emergencyContactsController.create)
  .get(
    validateRoleAuth([UserRoles.USER]),
    emergencyContactsController.getForUser
  );

emergencyContactsRouter.get(
  '/common/all',
  emergencyContactsController.getCommon
);

emergencyContactsRouter
  .route('/:id')
  .get(emergencyContactsController.getById)
  .put(validateRoleAuth([UserRoles.USER]), emergencyContactsController.update)
  .delete(
    validateRoleAuth([UserRoles.USER, UserRoles.ADMIN]),
    emergencyContactsController.remove
  );

// Toggle notification for a specific contact
emergencyContactsRouter
  .route('/:id/toggle-notification')
  .patch(
    validateRoleAuth([UserRoles.USER]),
    emergencyContactsController.toggleNotification
  );

// Update push token for emergency contact (if they have the app)
emergencyContactsRouter
  .route('/:id/push-token')
  .patch(
    validateRoleAuth([UserRoles.USER]),
    emergencyContactsController.updatePushToken
  );

export default emergencyContactsRouter;
