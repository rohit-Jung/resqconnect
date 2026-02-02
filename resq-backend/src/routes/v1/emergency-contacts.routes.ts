import express from 'express';

import { UserRoles } from '@/constants';
import {
  createEmergencyContact,
  deleteEmergencyContact,
  getCommonEmergencyContacts,
  getEmergencyContact,
  getUserEmergencyContacts,
  toggleContactNotification,
  updateContactPushToken,
  updateEmergencyContact,
} from '@/controllers/emergency-contacts.controller';
import { validateRoleAuth } from '@/middlewares/auth.middleware';

const emergencyContactsRouter = express.Router();

emergencyContactsRouter
  .route('/')
  .post(validateRoleAuth([UserRoles.USER]), createEmergencyContact)
  .get(validateRoleAuth([UserRoles.USER]), getUserEmergencyContacts);

emergencyContactsRouter.get('/common/all', getCommonEmergencyContacts);

emergencyContactsRouter
  .route('/:id')
  .get(getEmergencyContact)
  .put(validateRoleAuth([UserRoles.USER]), updateEmergencyContact)
  .delete(validateRoleAuth([UserRoles.USER, UserRoles.ADMIN]), deleteEmergencyContact);

// Toggle notification for a specific contact
emergencyContactsRouter
  .route('/:id/toggle-notification')
  .patch(validateRoleAuth([UserRoles.USER]), toggleContactNotification);

// Update push token for emergency contact (if they have the app)
emergencyContactsRouter
  .route('/:id/push-token')
  .patch(validateRoleAuth([UserRoles.USER]), updateContactPushToken);

export default emergencyContactsRouter;
