import { Router } from 'express';

import {
  healthCheck,
  workerHealthCheck,
} from '@/controllers/healthcheck.controller';

const healthCheckRouter = Router();

healthCheckRouter.route('/').get(healthCheck);
healthCheckRouter.route('/workers').get(workerHealthCheck);
healthCheckRouter.route('/workers/sms').get(workerHealthCheck);

export default healthCheckRouter;
