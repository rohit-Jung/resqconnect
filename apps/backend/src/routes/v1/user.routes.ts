import express from 'express';

import { UserRoles } from '@/constants';
import {
  changePassword,
  forgotPassword,
  getEmergencySettings,
  getProfile,
  getUser,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  updateEmergencySettings,
  updatePushToken,
  updateUser,
  verifyUser,
} from '@/controllers/user.controller';
import {
  validateRequestBody,
  validateRoleAuth,
} from '@/middlewares/auth.middleware';
import { loginUserSchema, newUserSchema } from '@/models';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateEmergencySettingsSchema,
  updatePushTokenSchema,
  verifyUserSchema,
} from '@/validations/user.validations';

const userRouter = express.Router();
const validateUser = validateRoleAuth([UserRoles.USER]);

userRouter
  .route('/register')
  .post(validateRequestBody(newUserSchema), registerUser);
userRouter
  .route('/login')
  .post(validateRequestBody(loginUserSchema), loginUser);
userRouter
  .route('/logout')
  .get(validateRoleAuth([UserRoles.USER, UserRoles.ADMIN]), logoutUser);

userRouter
  .route('/update')
  .put(validateRoleAuth([UserRoles.USER, UserRoles.ADMIN]), updateUser);

userRouter
  .route('/verify')
  .post(validateRequestBody(verifyUserSchema), verifyUser);

userRouter
  .route('/forgot-password')
  .post(validateRequestBody(forgotPasswordSchema), forgotPassword);
userRouter
  .route('/reset-password')
  .post(validateRequestBody(resetPasswordSchema), resetPassword);
userRouter
  .route('/change-password')
  .post(
    validateUser,
    validateRequestBody(changePasswordSchema),
    changePassword
  );

userRouter
  .route('/profile')
  .get(validateRoleAuth([UserRoles.USER, UserRoles.ADMIN]), getProfile);
userRouter.route('/:userId').get(validateRoleAuth([UserRoles.ADMIN]), getUser);

userRouter.post(
  '/update-push-token',
  validateUser,
  validateRequestBody(updatePushTokenSchema),
  updatePushToken
);

userRouter
  .route('/settings/emergency')
  .get(validateUser, getEmergencySettings)
  .put(
    validateUser,
    validateRequestBody(updateEmergencySettingsSchema),
    updateEmergencySettings
  );

export default userRouter;
