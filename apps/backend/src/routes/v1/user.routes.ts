import { loginUserSchema, newUserSchema } from '@repo/db/schemas';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  resendUserVerificationOTPSchema,
  resetPasswordSchema,
  updateEmergencySettingsSchema,
  updatePushTokenSchema,
  verifyUserSchema,
} from '@repo/types/validations';

import express from 'express';

import { authLimiter, otpLimiter, passwordResetLimiter } from '@/config';
import { UserRoles } from '@/constants';
import userController from '@/controllers/user.controller';
import {
  validateRequestBody,
  validateRoleAuth,
} from '@/middlewares/auth.middleware';

const userRouter = express.Router();
const validateUser = validateRoleAuth([UserRoles.USER]);

userRouter
  .route('/register')
  .post(
    authLimiter,
    validateRequestBody(newUserSchema),
    userController.register
  );
userRouter
  .route('/login')
  .post(
    authLimiter,
    validateRequestBody(loginUserSchema),
    userController.login
  );
userRouter
  .route('/logout')
  .get(
    validateRoleAuth([UserRoles.USER, UserRoles.ADMIN]),
    userController.logout
  );

userRouter
  .route('/update')
  .put(
    validateRoleAuth([UserRoles.USER, UserRoles.ADMIN]),
    userController.update
  );

userRouter
  .route('/verify')
  .post(
    otpLimiter,
    validateRequestBody(verifyUserSchema),
    userController.verify
  );

userRouter
  .route('/resend-otp')
  .post(
    otpLimiter,
    validateRequestBody(resendUserVerificationOTPSchema),
    userController.resendVerificationOTP
  );

userRouter
  .route('/forgot-password')
  .post(
    passwordResetLimiter,
    validateRequestBody(forgotPasswordSchema),
    userController.forgotPassword
  );
userRouter
  .route('/reset-password')
  .post(
    passwordResetLimiter,
    validateRequestBody(resetPasswordSchema),
    userController.resetPassword
  );
userRouter
  .route('/change-password')
  .post(
    validateUser,
    validateRequestBody(changePasswordSchema),
    userController.changePassword
  );

userRouter
  .route('/profile')
  .get(
    validateRoleAuth([UserRoles.USER, UserRoles.ADMIN]),
    userController.profile
  );
userRouter
  .route('/:userId')
  .get(validateRoleAuth([UserRoles.ADMIN]), userController.getById);

userRouter.post(
  '/update-push-token',
  validateUser,
  validateRequestBody(updatePushTokenSchema),
  userController.updatePushToken
);

userRouter
  .route('/settings/emergency')
  .get(validateUser, userController.getEmergencySettings)
  .put(
    validateUser,
    validateRequestBody(updateEmergencySettingsSchema),
    userController.updateEmergencySettings
  );

export default userRouter;
