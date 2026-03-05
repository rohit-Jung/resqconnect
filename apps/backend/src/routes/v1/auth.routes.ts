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
} from '@/controllers/auth.controller';
import { validateRoleAuth } from '@/middlewares/auth.middleware';

const userRouter = express.Router();
const validateUser = validateRoleAuth([UserRoles.USER]);

userRouter.route('/register').post(registerUser);
// FIX: login is taking time check this
userRouter.route('/login').post(loginUser);
userRouter
  .route('/logout')
  .get(validateRoleAuth([UserRoles.USER, UserRoles.ADMIN]), logoutUser);

userRouter
  .route('/update')
  .put(validateRoleAuth([UserRoles.USER, UserRoles.ADMIN]), updateUser);

// Verify endpoint is public - user doesn't have a valid JWT yet
// Authentication is done via userId + otpToken in the request body
userRouter.route('/verify').post(verifyUser);

userRouter.route('/forgot-password').post(forgotPassword);
userRouter.route('/reset-password').post(resetPassword);
userRouter.route('/change-password').post(validateUser, changePassword);

userRouter
  .route('/profile')
  .get(validateRoleAuth([UserRoles.USER, UserRoles.ADMIN]), getProfile);
userRouter.route('/:userId').get(validateRoleAuth([UserRoles.ADMIN]), getUser);

userRouter.post('/update-push-token', validateUser, updatePushToken);

// Emergency contact notification settings
userRouter
  .route('/settings/emergency')
  .get(validateUser, getEmergencySettings)
  .put(validateUser, updateEmergencySettings);

export default userRouter;
