import { Router } from 'express';

import { dbHealthcheck, healthcheck } from '@/controllers/health.controller';
import { asyncHandler } from '@/utils/async-handler';

export const healthRouter = Router();

healthRouter.get('/', healthcheck);
healthRouter.get('/db', asyncHandler(dbHealthcheck));
