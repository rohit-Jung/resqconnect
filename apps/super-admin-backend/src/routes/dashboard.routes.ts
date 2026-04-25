import { Router } from 'express';

import { getDashboard } from '@/controllers/dashboard.controller';
import { requireAdminAuth } from '@/middlewares/admin-auth.middleware';
import { asyncHandler } from '@/utils/async-handler';

export const dashboardRouter = Router();

dashboardRouter.get('/', requireAdminAuth, asyncHandler(getDashboard));
