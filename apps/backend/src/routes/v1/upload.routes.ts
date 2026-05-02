import express from 'express';

import { UserRoles } from '@/constants';
import uploadController from '@/controllers/upload.controller';
import { validateRoleAuth } from '@/middlewares/auth.middleware';

const uploadRouter = express.Router();
const validateUser = validateRoleAuth([UserRoles.USER, UserRoles.ADMIN]);

// get signed url
uploadRouter.get('/signature', validateUser, uploadController.getSignature);

// update profile picture url after successful upload
uploadRouter.put(
  '/profile-picture',
  validateUser,
  uploadController.updateProfilePicture
);
uploadRouter.delete(
  '/profile-picture',
  validateUser,
  uploadController.deleteProfilePicture
);

export default uploadRouter;
