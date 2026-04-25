import express from 'express';

import { UserRoles } from '@/constants';
import emergencyContactsController from '@/controllers/emergency-contacts.controller';
import { validateRoleAuth } from '@/middlewares/auth.middleware';

const emergencyContactsRouter = express.Router();

emergencyContactsRouter
  .route('/')
  .post(
    validateRoleAuth([UserRoles.USER]),
    emergencyContactsController.createEmergencyContact
  )
  .get(
    validateRoleAuth([UserRoles.USER]),
    emergencyContactsController.getUserEmergencyContacts
  );

emergencyContactsRouter.get(
  '/common/all',
  emergencyContactsController.getCommonEmergencyContacts
);

emergencyContactsRouter
  .route('/:id')
  .get(emergencyContactsController.getEmergencyContact)
  .put(
    validateRoleAuth([UserRoles.USER]),
    emergencyContactsController.updateEmergencyContact
  )
  .delete(
    validateRoleAuth([UserRoles.USER, UserRoles.ADMIN]),
    emergencyContactsController.deleteEmergencyContact
  );

// Toggle notification for a specific contact
emergencyContactsRouter
  .route('/:id/toggle-notification')
  .patch(
    validateRoleAuth([UserRoles.USER]),
    emergencyContactsController.toggleContactNotification
  );

// Update push token for emergency contact (if they have the app)
emergencyContactsRouter
  .route('/:id/push-token')
  .patch(
    validateRoleAuth([UserRoles.USER]),
    emergencyContactsController.updateContactPushToken
  );

export default emergencyContactsRouter;
