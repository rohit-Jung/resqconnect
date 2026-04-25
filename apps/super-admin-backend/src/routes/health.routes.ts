import { Router } from 'express';

import { dbHealthcheck, healthcheck } from '@/controllers/health.controller';

export const healthRouter = Router();

healthRouter.get('/', healthcheck);
healthRouter.get('/db', dbHealthcheck);
