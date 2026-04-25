import { Router } from 'express';
import { z } from 'zod';

import mfaController from '@/controllers/mfa.controller';
import { validateRequestBody } from '@/middlewares/auth.middleware';
import { requireAuthenticatedAny } from '@/middlewares/require-auth-any.middleware';

const mfaRouter = Router();

// requires a valid jwt (any role). mfa not required for these endpoints.
mfaRouter.use(requireAuthenticatedAny);

mfaRouter.post('/request', mfaController.requestMfaOtp);
mfaRouter.post(
  '/verify',
  validateRequestBody(z.object({ otpToken: z.string() })),
  mfaController.verifyMfaOtp
);

export default mfaRouter;
