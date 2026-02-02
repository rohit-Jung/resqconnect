import { Router } from 'express';

import healthCheckRouter from '@/routes/healthcheck.routes';
import userRouter from '@/routes/v1/user.routes';

import emergencyContactsRouter from './emergency-contacts.routes';
import emergencyRequestRouter from './emergency-request.routes';
import emergencyResponseRouter from './emergency-response.routes';
import organizationRouter from './organization.routes';
import serviceProviderRouter from './service-provider.routes';

const v1Router = Router();

v1Router.use('/healthcheck', healthCheckRouter);
v1Router.use('/user', userRouter);
v1Router.use('/organization', organizationRouter);
v1Router.use('/emergency-request', emergencyRequestRouter);
v1Router.use('/emergency-response', emergencyResponseRouter);
v1Router.use('/emergency-contacts', emergencyContactsRouter);
v1Router.use('/service-provider', serviceProviderRouter);

export { v1Router };
