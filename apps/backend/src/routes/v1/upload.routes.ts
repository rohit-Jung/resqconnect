import express from 'express';

import { UserRoles } from '@/constants';
import {
  deleteProfilePicture,
  getUploadSignature,
  updateProfilePicture,
} from '@/controllers/upload.controller';
import { validateRoleAuth } from '@/middlewares/auth.middleware';

const uploadRouter = express.Router();
const validateUser = validateRoleAuth([UserRoles.USER, UserRoles.ADMIN]);

// Get signed URL
uploadRouter.get('/signature', validateUser, getUploadSignature);

// Update profile picture URL after successful upload
uploadRouter.put('/profile-picture', validateUser, updateProfilePicture);
uploadRouter.delete('/profile-picture', validateUser, deleteProfilePicture);

export default uploadRouter;
