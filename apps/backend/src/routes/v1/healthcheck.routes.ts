import { Router } from 'express';

import healthcheckController from '@/controllers/healthcheck.controller';

const healthCheckRouter = Router();

healthCheckRouter.route('/').get(healthcheckController.healthCheck);
healthCheckRouter
  .route('/workers')
  .get(healthcheckController.workerHealthCheck);
healthCheckRouter
  .route('/workers/sms')
  .get(healthcheckController.workerHealthCheck);

export default healthCheckRouter;
