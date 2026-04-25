import { SmsGatewaySchema } from '@repo/types/validations';

import express from 'express';

import { validateRequestBody } from '@/middlewares/auth.middleware';
import * as smsService from '@/services/sms.service';

const webHookRouter = express.Router();

webHookRouter
  .route('/messaging')
  .post(validateRequestBody(SmsGatewaySchema), smsService.handleSmsWebhook);

export default webHookRouter;
