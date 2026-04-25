import { Router } from 'express';

import healthcheckController from '@/controllers/healthcheck.controller';

const healthCheckRouter = Router();

healthCheckRouter.route('/').get(healthcheckController.healthCheck);

export default healthCheckRouter;
