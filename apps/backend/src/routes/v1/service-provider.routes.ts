import {
  loginServiceProviderSchema,
  uploadDocumentsSchema,
} from '@repo/db/schemas';
import { serviceProviderValidations } from '@repo/types/validations';

import { Router } from 'express';
import { z } from 'zod';

import {
  authLimiter,
  otpLimiter,
  passwordResetLimiter,
} from '@/config/rate-limit.config';
import serviceProviderController from '@/controllers/service-provider.controller';
import {
  validateRequestBody,
  validateServiceProvider,
} from '@/middlewares/auth.middleware';
import { requireActiveProviderOrganization } from '@/middlewares/org-status.guard';

const serviceProviderRouter = Router();

serviceProviderRouter.post(
  '/register',
  authLimiter,
  serviceProviderController.registerServiceProvider
);
serviceProviderRouter.post(
  '/login',
  authLimiter,
  validateRequestBody(loginServiceProviderSchema),
  serviceProviderController.loginServiceProvider
);
serviceProviderRouter.post(
  '/verify',
  otpLimiter,
  validateRequestBody(serviceProviderValidations.verifyServiceProviderSchema),
  serviceProviderController.verifyServiceProvider
);

serviceProviderRouter.post(
  '/resend-otp',
  otpLimiter,
  validateRequestBody(
    serviceProviderValidations.resendServiceProviderVerificationOTPSchema
  ),
  serviceProviderController.resendServiceProviderVerificationOTP
);
serviceProviderRouter.post(
  '/forgot-password',
  passwordResetLimiter,
  validateRequestBody(
    serviceProviderValidations.forgotServiceProviderPasswordSchema
  ),
  serviceProviderController.forgotServiceProviderPassword
);
serviceProviderRouter.post(
  '/reset-password',
  passwordResetLimiter,
  validateRequestBody(
    serviceProviderValidations.resetServiceProviderPasswordSchema
  ),
  serviceProviderController.resetServiceProviderPassword
);
serviceProviderRouter.get(
  '/nearby',
  serviceProviderController.getNearbyProviders
);

// protected routes
serviceProviderRouter.use(validateServiceProvider);
serviceProviderRouter.use(requireActiveProviderOrganization);
serviceProviderRouter.post(
  '/logout',
  serviceProviderController.logoutServiceProvider
);
serviceProviderRouter.get(
  '/profile',
  serviceProviderController.getServiceProviderProfile
);

// profile picture (direct-to-Cloudinary signed upload)
serviceProviderRouter.get(
  '/profile-picture/signature',
  serviceProviderController.getProfilePictureUploadSignature
);
serviceProviderRouter.put(
  '/profile-picture',
  validateRequestBody(
    z.object({
      profilePictureUrl: z.string().url('Must be url'),
    })
  ),
  serviceProviderController.updateProfilePicture
);
serviceProviderRouter.delete(
  '/profile-picture',
  serviceProviderController.deleteProfilePicture
);
serviceProviderRouter.patch(
  '/update',
  validateRequestBody(serviceProviderValidations.updateServiceProviderSchema),
  serviceProviderController.updateServiceProvider
);
serviceProviderRouter.patch(
  '/update-location',
  validateRequestBody(
    serviceProviderValidations.updateServiceProviderLocationSchema
  ),
  serviceProviderController.updateServiceProviderLocation
);
serviceProviderRouter.delete(
  '/delete',
  serviceProviderController.deleteServiceProvider
);
serviceProviderRouter.post(
  '/change-password',
  validateRequestBody(serviceProviderValidations.changeProviderPasswordSchema),
  serviceProviderController.changeProviderPassword
);

// document verification routes (provider uploads documents)
serviceProviderRouter.post(
  '/documents',
  validateRequestBody(uploadDocumentsSchema),
  serviceProviderController.uploadVerificationDocuments
);
serviceProviderRouter.get(
  '/documents/signatures',
  serviceProviderController.getDocumentUploadSignatures
);
serviceProviderRouter.get(
  '/documents/status',
  serviceProviderController.getDocumentStatus
);

serviceProviderRouter.get('/:id', serviceProviderController.getServiceProvider);
serviceProviderRouter.patch(
  '/status',
  validateRequestBody(
    serviceProviderValidations.updateServiceProviderStatusSchema
  ),
  serviceProviderController.updateServiceProviderStatus
);

export default serviceProviderRouter;
