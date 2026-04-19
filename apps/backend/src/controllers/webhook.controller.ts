import express from 'express';

import { validateRequestBody } from '@/middlewares/auth.middleware';
import * as smsService from '@/services/sms.service';
import { SmsGatewaySchema } from '@/validations/messages.validations';

const webHookRouter = express.Router();

webHookRouter
  .route('/messaging')
  .post(validateRequestBody(SmsGatewaySchema), smsService.handleSmsWebhook);

export default webHookRouter;
