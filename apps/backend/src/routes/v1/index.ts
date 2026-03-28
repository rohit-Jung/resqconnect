import { Router } from 'express';

import healthCheckRouter from '@/routes/healthcheck.routes';
import userRouter from '@/routes/v1/auth.routes';

import adminRouter from './admin.routes';
import emergencyContactsRouter from './emergency-contacts.routes';
import emergencyRequestRouter from './emergency-request.routes';
import emergencyResponseRouter from './emergency-response.routes';
import mapsRouter from './maps.routes';
import organizationRouter from './organization.routes';
import paymentRouter from './payment.routes';
import serviceProviderRouter from './service-provider.routes';

const v1Router = Router();

v1Router.use('/healthcheck', healthCheckRouter);
v1Router.use('/user', userRouter);
v1Router.use('/organization', organizationRouter);
v1Router.use('/emergency-request', emergencyRequestRouter);
v1Router.use('/emergency-response', emergencyResponseRouter);
v1Router.use('/emergency-contacts', emergencyContactsRouter);
v1Router.use('/service-provider', serviceProviderRouter);
v1Router.use('/maps', mapsRouter);
v1Router.use('/admin', adminRouter);
v1Router.use('/payments', paymentRouter);

export { v1Router };
