import { Router } from 'express';

import { envConfig } from '@/config';
import healthCheckRouter from '@/routes/healthcheck.routes';
import userRouter from '@/routes/v1/user.routes';
import webHookRouter from '@/routes/v1/webhook.routes';

import adminRouter from './admin.routes';
import emergencyContactsRouter from './emergency-contacts.routes';
import emergencyRequestRouter from './emergency-request.routes';
import emergencyResponseRouter from './emergency-response.routes';
import internalRouter from './internal.routes';
import mapsRouter from './maps.routes';
import mfaRouter from './mfa.routes';
import notificationRouter from './notification.routes';
import organizationRouter from './organization.routes';
import paymentRouter from './payment.routes';
import serviceProviderRouter from './service-provider.routes';
import uploadRouter from './upload.routes';

const v1Router = Router();

v1Router.use('/healthcheck', healthCheckRouter);
v1Router.use('/internal', internalRouter);

// Mode-gated routes.
// platform owns civilian/user and incident creation.
// silo owns providers/dispatch and operational data.
if (envConfig.mode === 'platform') {
  v1Router.use('/user', userRouter);
  v1Router.use('/emergency-request', emergencyRequestRouter);
  v1Router.use('/emergency-response', emergencyResponseRouter);
  v1Router.use('/emergency-contacts', emergencyContactsRouter);
  v1Router.use('/notification', notificationRouter);
  v1Router.use('/maps', mapsRouter);
  v1Router.use('/mfa', mfaRouter);
  v1Router.use('/upload', uploadRouter);
  v1Router.use('/webhooks', webHookRouter);
} else {
  // silo mode needs emergency-request routes for accept/reject/complete
  v1Router.use('/emergency-request', emergencyRequestRouter);
  v1Router.use('/organization', organizationRouter);
  v1Router.use('/service-provider', serviceProviderRouter);
  v1Router.use('/maps', mapsRouter);
  v1Router.use('/mfa', mfaRouter);
  v1Router.use('/admin', adminRouter);
  v1Router.use('/payments', paymentRouter);
  v1Router.use('/webhooks', webHookRouter);
}

export { v1Router };
